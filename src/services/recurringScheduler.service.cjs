const {
    SCHEDULER_LEASE_MS,
    MAX_CATCH_UP_DAYS
} = require("../config/recurringScheduler.config.cjs");
const {
    processTemplate
} = require("./recurringChore.service.cjs");

const getTemplateModel = async (TemplateModel) => {
    if (TemplateModel) {
        return TemplateModel;
    }

    return (await import("../models/RecurringChoreTemplate.js")).default;
};

const claimTemplate = async (
    templateId,
    now = new Date(),
    {
        TemplateModel,
        leaseMs = SCHEDULER_LEASE_MS
    } = {}
) => {
    TemplateModel = await getTemplateModel(TemplateModel);
    const leaseUntil = new Date(now.getTime() + leaseMs);

    return TemplateModel.findOneAndUpdate(
        {
            _id: templateId,
            "schedulerMetadata.nextRunAt": { $lte: now },
            "activePeriod.startsAt": { $lte: now },
            $or: [
                { "activePeriod.endsAt": null },
                { "activePeriod.endsAt": { $gt: now } }
            ],
            $or: [
                { "schedulerMetadata.processingLeaseUntil": null },
                { "schedulerMetadata.processingLeaseUntil": { $lte: now } }
            ]
        },
        {
            $set: {
                "schedulerMetadata.processingLeaseUntil": leaseUntil
            }
        },
        {
            returnDocument: "after"
        }
    );
};

const completeClaim = async (
    templateId,
    leaseUntil,
    updates,
    { TemplateModel } = {}
) => {
    TemplateModel = await getTemplateModel(TemplateModel);
    const set = {
        "schedulerMetadata.processingLeaseUntil": null
    };

    if (updates.nextRunAt) {
        set["schedulerMetadata.nextRunAt"] = updates.nextRunAt;
    }

    if (updates.lastProcessedAt) {
        set["schedulerMetadata.lastProcessedAt"] =
            updates.lastProcessedAt;
    }

    return TemplateModel.updateOne(
        {
            _id: templateId,
            "schedulerMetadata.processingLeaseUntil": leaseUntil
        },
        { $set: set }
    );
};

const startSchedulerLoop = ({
    runTick = runSchedulerTick,
    intervalMs = require("../config/recurringScheduler.config.cjs").SCHEDULER_INTERVAL_MS,
    setIntervalFn = setInterval,
    nowFn = () => new Date()
} = {}) => {
    let running = false;

    const tick = async () => {
        if (running) {
            return;
        }

        running = true;

        try {
            await runTick(nowFn());
        } catch (error) {
            console.error("Recurring scheduler tick failed:", error);
        } finally {
            running = false;
        }
    };

    const timer = setIntervalFn(tick, intervalMs);
    return {
        timer,
        stop: () => clearInterval(timer)
    };
};

const runSchedulerTick = async (
    now = new Date(),
    {
        TemplateModel,
        processTemplateFn = processTemplate
    } = {}
) => {
    TemplateModel = await getTemplateModel(TemplateModel);

    const dueTemplates = await TemplateModel.find({
        "schedulerMetadata.nextRunAt": { $lte: now },
        "activePeriod.startsAt": { $lte: now },
        $or: [
            { "activePeriod.endsAt": null },
            { "activePeriod.endsAt": { $gt: now } }
        ]
    }).lean?.() || await TemplateModel.find({
        "schedulerMetadata.nextRunAt": { $lte: now },
        "activePeriod.startsAt": { $lte: now },
        $or: [
            { "activePeriod.endsAt": null },
            { "activePeriod.endsAt": { $gt: now } }
        ]
    });

    let processed = 0;
    let failed = 0;

    for (const candidate of dueTemplates) {
        try {
            const claimed = await claimTemplate(
                candidate._id,
                now,
                { TemplateModel }
            );

            if (!claimed) {
                continue;
            }

            const updates = await processTemplateFn(
                claimed,
                now,
                { catchUpDays: MAX_CATCH_UP_DAYS }
            );

            const leaseUntil =
                claimed.schedulerMetadata.processingLeaseUntil;

            const completion = await completeClaim(
                claimed._id,
                leaseUntil,
                updates,
                { TemplateModel }
            );

            if (!completion.matchedCount) {
                throw new Error("Scheduler lease was lost before completion");
            }

            processed += 1;
        } catch (error) {
            failed += 1;
            console.error(
                `Recurring template ${candidate._id} failed:`,
                error
            );
        }
    }

    return {
        processed,
        failed
    };
};

module.exports = {
    claimTemplate,
    completeClaim,
    runSchedulerTick,
    startSchedulerLoop
};
