const { resolveAssignee } = require("./assignment.service.cjs");

const getChoreModel = async (ChoreModel) =>
    ChoreModel || (await import("../models/Chore.js")).default;

const MAX_CATCH_UP_DAYS = 30;

const isDuplicateKeyError = (error) => error?.code === 11000;

const normalizeOccurrenceDate = (value) => {
    const date = value instanceof Date
        ? new Date(value.getTime())
        : new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid occurrence date");
    }

    return date;
};

const getRecurrenceFunctionName = (frequency) => {
    const names = {
        daily: "getDailyOccurrences",
        weekly: "getWeeklyOccurrences",
        monthly: "getMonthlyOccurrences",
        yearly: "getYearlyOccurrences"
    };

    const name = names[frequency];

    if (!name) {
        throw new Error(`Unsupported recurrence frequency: ${frequency}`);
    }

    return name;
};

const getOccurrenceDates = async (
    template,
    startDate,
    endDate,
    recurrenceUtils
) => {
    const functionName = getRecurrenceFunctionName(
        template.schedule.frequency
    );

    const args = {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        interval: template.schedule.interval
    };

    if (template.schedule.frequency === "weekly") {
        args.weekdays = template.schedule.weekdays;
    }

    if (template.schedule.frequency === "monthly") {
        args.monthlyRule = template.schedule.monthlyRule;
        args.dayOfMonth = template.schedule.dayOfMonth;
    }

    if (template.schedule.frequency === "yearly") {
        args.month = template.schedule.month;
        args.dayOfMonth = template.schedule.dayOfMonth;
    }

    const dates = await recurrenceUtils[functionName](args);

    return dates
        .map(normalizeOccurrenceDate)
        .filter((date) => date <= endDate)
        .sort((a, b) => a - b);
};

const generateOccurrence = async (
    template,
    occurrenceDate,
    {
        generationType = "normal",
        ChoreModel,
        resolveAssigneeFn = resolveAssignee,
        now = new Date()
    } = {}
) => {
    ChoreModel = await getChoreModel(ChoreModel);

    const normalizedDate = normalizeOccurrenceDate(occurrenceDate);

    const assignment = await resolveAssigneeFn(
        template,
        now
    );

    if (!assignment.ok) {
        return {
            created: false,
            reason: assignment.reason
        };
    }

    const payload = {
        title: template.title,
        description: template.description || "",
        householdId: template.householdId,
        assignedTo: assignment.assignee,
        createdBy: template.createdBy,
        choreType: "recurring",
        recurringTemplateId: template._id,
        occurrenceDate: normalizedDate,
        generationType,
        completionStatus: "pending",
        approvalStatus: "approved",
        source: "admin-assigned",
        approvedDifficulty: template.metadata?.difficulty,
        dueDate: normalizedDate
    };

    try {
        const chore = await ChoreModel.create(payload);

        return {
            created: true,
            idempotent: false,
            chore
        };
    } catch (error) {
        if (!isDuplicateKeyError(error)) {
            throw error;
        }

        const existing = await ChoreModel.findOne({
            recurringTemplateId: template._id,
            occurrenceDate: normalizedDate,
            choreType: "recurring"
        }).lean();

        if (!existing) {
            throw error;
        }

        return {
            created: false,
            idempotent: true,
            chore: existing
        };
    }
};

const getNextOccurrence = async (
    template,
    now,
    recurrenceUtils
) => {
    const horizonDays = {
        daily: 366,
        weekly: 366,
        monthly: 366 * 5,
        yearly: 366 * 20
    }[template.schedule.frequency] || 366;

    // Recurrence utilities operate on calendar dates, so "next" must
    // begin on the day after today rather than at a time later today.
    const startDate = new Date(now.getTime());
    startDate.setUTCHours(0, 0, 0, 0);
    startDate.setUTCDate(startDate.getUTCDate() + 1);

    const endDate = new Date(
        startDate.getTime() +
        horizonDays * 24 * 60 * 60 * 1000
    );

    const dates = await getOccurrenceDates(
        template,
        startDate,
        endDate,
        recurrenceUtils
    );

    return dates[0] || null;
};

const processTemplate = async (
    template,
    now = new Date(),
    {
        recurrenceUtils,
        generateOccurrenceFn = generateOccurrence,
        catchUpDays = MAX_CATCH_UP_DAYS
    } = {}
) => {
    if (!recurrenceUtils) {
        recurrenceUtils = await import("../utils/recurrence.utils.js");
    }

    const activeStart = new Date(template.activePeriod.startsAt);
    const catchUpStart = new Date(now.getTime());
    catchUpStart.setUTCDate(
        catchUpStart.getUTCDate() - catchUpDays
    );

    let startDate = activeStart > catchUpStart
        ? activeStart
        : catchUpStart;

    if (template.schedulerMetadata?.lastProcessedAt) {
        const last = new Date(template.schedulerMetadata.lastProcessedAt);
        if (last >= startDate) {
            startDate = new Date(last);
            startDate.setUTCHours(0, 0, 0, 0);
            startDate.setUTCDate(startDate.getUTCDate() + 1);
        }
    }

    let endDate = new Date(now.getTime());

    if (
        template.activePeriod.endsAt &&
        new Date(template.activePeriod.endsAt) < endDate
    ) {
        endDate = new Date(template.activePeriod.endsAt);
    }

    if (startDate > endDate) {
        return {
            occurrencesProcessed: 0,
            lastProcessedAt: template.schedulerMetadata?.lastProcessedAt || null,
            nextRunAt: template.schedulerMetadata?.nextRunAt || null
        };
    }

    const occurrenceDates = await getOccurrenceDates(
        template,
        startDate,
        endDate,
        recurrenceUtils
    );

    let lastProcessedAt = template.schedulerMetadata?.lastProcessedAt
        ? new Date(template.schedulerMetadata.lastProcessedAt)
        : null;

    for (const occurrenceDate of occurrenceDates) {
        const generationType =
            occurrenceDate.getUTCFullYear() === now.getUTCFullYear() &&
            occurrenceDate.getUTCMonth() === now.getUTCMonth() &&
            occurrenceDate.getUTCDate() === now.getUTCDate()
                ? "normal"
                : "recovery";

        const result = await generateOccurrenceFn(
            template,
            occurrenceDate,
            { generationType, now }
        );

        if (!result.created && !result.idempotent) {
            throw new Error(
                `Recurring occurrence was not generated: ${result.reason}`
            );
        }

        lastProcessedAt = occurrenceDate;
    }

    const nextRunAt = await getNextOccurrence(
        template,
        now,
        recurrenceUtils
    );

    return {
        occurrencesProcessed: occurrenceDates.length,
        lastProcessedAt,
        nextRunAt: nextRunAt || template.schedulerMetadata?.nextRunAt || null
    };
};

module.exports = {
    MAX_CATCH_UP_DAYS,
    normalizeOccurrenceDate,
    generateOccurrence,
    processTemplate,
    getNextOccurrence
};
