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
    recurrenceUtils,
    minimumDate = startDate
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

    const normalizedMinimumDate = new Date(minimumDate.getTime());
    normalizedMinimumDate.setUTCHours(0, 0, 0, 0);

    return dates
        .map(normalizeOccurrenceDate)
        .filter(
            (date) =>
                date >= normalizedMinimumDate &&
                date <= endDate
        )
        .sort((a, b) => a - b);
};

const getUtcDayDifference = (from, to) =>
    Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));

const getWeekStart = (date) => {
    const result = new Date(date.getTime());
    result.setUTCHours(0, 0, 0, 0);
    result.setUTCDate(result.getUTCDate() - result.getUTCDay());
    return result;
};

const getMonthStart = (date) => {
    const result = new Date(date.getTime());
    result.setUTCHours(0, 0, 0, 0);
    result.setUTCDate(1);
    return result;
};

const getYearStart = (date) => {
    const result = new Date(date.getTime());
    result.setUTCHours(0, 0, 0, 0);
    result.setUTCMonth(0, 1);
    return result;
};

const greatestCommonDivisor = (a, b) => {
    let x = Math.abs(a);
    let y = Math.abs(b);

    while (y !== 0) {
        const remainder = x % y;
        x = y;
        y = remainder;
    }

    return x;
};

// Return a bounded recurrence-search anchor that preserves the template's
// interval phase while avoiding generation of every historical occurrence.
const getRecurrenceSearchStart = (
    frequency,
    activeStart,
    nextEligibleDate,
    interval
) => {
    if (activeStart >= nextEligibleDate) {
        return activeStart;
    }

    if (frequency === "daily") {
        const elapsedDays = getUtcDayDifference(
            activeStart,
            nextEligibleDate
        );
        const alignedDays = Math.floor(elapsedDays / interval) * interval;
        const candidate = new Date(activeStart.getTime());
        candidate.setUTCDate(candidate.getUTCDate() + alignedDays);
        return candidate;
    }

    if (frequency === "weekly") {
        const activeWeek = getWeekStart(activeStart);
        const eligibleWeek = getWeekStart(nextEligibleDate);
        const elapsedWeeks = Math.floor(
            getUtcDayDifference(activeWeek, eligibleWeek) / 7
        );
        const alignedWeeks = Math.floor(elapsedWeeks / interval) * interval;
        const candidate = new Date(activeWeek.getTime());
        candidate.setUTCDate(candidate.getUTCDate() + alignedWeeks * 7);
        return candidate < activeStart ? activeStart : candidate;
    }

    if (frequency === "monthly") {
        const activeMonth = getMonthStart(activeStart);
        const eligibleMonth = getMonthStart(nextEligibleDate);
        const elapsedMonths =
            (eligibleMonth.getUTCFullYear() - activeMonth.getUTCFullYear()) * 12 +
            (eligibleMonth.getUTCMonth() - activeMonth.getUTCMonth());
        const alignedMonths = Math.floor(elapsedMonths / interval) * interval;
        const candidate = new Date(activeMonth.getTime());
        candidate.setUTCMonth(candidate.getUTCMonth() + alignedMonths);
        return candidate < activeStart ? activeStart : candidate;
    }

    if (frequency === "yearly") {
        const activeYear = getYearStart(activeStart);
        const eligibleYear = getYearStart(nextEligibleDate);
        const elapsedYears =
            eligibleYear.getUTCFullYear() - activeYear.getUTCFullYear();
        const alignedYears = Math.floor(elapsedYears / interval) * interval;
        const candidate = new Date(activeYear.getTime());
        candidate.setUTCFullYear(candidate.getUTCFullYear() + alignedYears);
        return candidate < activeStart ? activeStart : candidate;
    }

    return activeStart;
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
    now = new Date(),
    recurrenceUtils
) => {
    if (!recurrenceUtils) {
        recurrenceUtils = await import("../utils/recurrence.utils.js");
    }

    // Search through one complete recurrence cycle after the aligned
    // recurrence anchor. The horizon therefore scales with the configured
    // interval instead of imposing a fixed window that can miss large intervals.
    const getSearchEndDate = (frequency, startDate, interval) => {
        if (frequency === "daily") {
            const endDate = new Date(startDate.getTime());
            endDate.setUTCDate(endDate.getUTCDate() + interval);
            return endDate;
        }

        if (frequency === "weekly") {
            const endDate = getWeekStart(startDate);
            endDate.setUTCDate(
                endDate.getUTCDate() + interval * 7 + 6
            );
            return endDate;
        }

        if (frequency === "monthly") {
            const endDate = getMonthStart(startDate);
            const cycleCount = 12 / greatestCommonDivisor(interval, 12);

            endDate.setUTCMonth(
                endDate.getUTCMonth() + interval * cycleCount + 1,
                0
            );
            return endDate;
        }

        if (frequency === "yearly") {
            const cycleCount = 4 / greatestCommonDivisor(interval, 4);

            return new Date(Date.UTC(
                startDate.getUTCFullYear() + interval * cycleCount + 1,
                0,
                0
            ));
        }

        throw new Error(
            `Unsupported recurrence frequency: ${frequency}`
        );
    };

    // Scheduler runs by calendar day: the next occurrence is strictly after
    // today's UTC calendar date.
    const nextEligibleDate = new Date(now.getTime());
    nextEligibleDate.setUTCHours(0, 0, 0, 0);
    nextEligibleDate.setUTCDate(nextEligibleDate.getUTCDate() + 1);

    const activeStart = new Date(template.activePeriod.startsAt);
    activeStart.setUTCHours(0, 0, 0, 0);

    if (template.activePeriod.endsAt) {
        const activeEnd = new Date(template.activePeriod.endsAt);
        activeEnd.setUTCHours(0, 0, 0, 0);

        if (activeEnd < nextEligibleDate) {
            return null;
        }
    }

    // Preserve the recurrence phase defined by activeStart, but only search
    // from the nearest aligned calendar bucket. This avoids iterating over
    // years of historical daily/monthly occurrences for old templates.
    const recurrenceStart = getRecurrenceSearchStart(
        template.schedule.frequency,
        activeStart,
        nextEligibleDate,
        template.schedule.interval
    );

    const horizonStart = recurrenceStart > nextEligibleDate
        ? recurrenceStart
        : nextEligibleDate;

    const endDate = getSearchEndDate(
        template.schedule.frequency,
        horizonStart,
        template.schedule.interval
    );

    if (template.activePeriod.endsAt) {
        const activeEnd = new Date(template.activePeriod.endsAt);
        activeEnd.setUTCHours(0, 0, 0, 0);

        if (endDate > activeEnd) {
            endDate.setTime(activeEnd.getTime());
        }
    }

    if (recurrenceStart > endDate) {
        return null;
    }

    const dates = await getOccurrenceDates(
        template,
        recurrenceStart,
        endDate,
        recurrenceUtils
    );

    return dates.find((date) => date >= nextEligibleDate) || null;
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

    const recurrenceAnchor = new Date(activeStart.getTime());
    recurrenceAnchor.setUTCHours(0, 0, 0, 0);

    const recurrenceSearchStart = getRecurrenceSearchStart(
        template.schedule.frequency,
        recurrenceAnchor,
        startDate,
        template.schedule.interval
    );

    const occurrenceDates = await getOccurrenceDates(
        template,
        recurrenceSearchStart,
        endDate,
        recurrenceUtils,
        startDate
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
        nextRunAt: nextRunAt || null
    };
};

module.exports = {
    MAX_CATCH_UP_DAYS,
    normalizeOccurrenceDate,
    generateOccurrence,
    processTemplate,
    getNextOccurrence
};
