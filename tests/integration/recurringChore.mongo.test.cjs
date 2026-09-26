const assert = require("node:assert/strict");
const test = require("node:test");
const mongoose = require("mongoose");
const crypto = require("node:crypto");

require("dotenv").config();

const MONGO_URI = process.env.TEST_MONGO_URI;
const describeIntegration = MONGO_URI ? test : test.skip;

let Chore;
let Membership;
let RecurringChoreTemplate;
let processTemplate;
let generateOccurrence;
let runSchedulerTick;

const ids = {
    householdId: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    idempotencyUserId: new mongoose.Types.ObjectId(),
    createdBy: new mongoose.Types.ObjectId()
};

const makeTemplate = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    title: "Integration recurring chore " + crypto.randomUUID().slice(0, 8),
    description: "MongoDB integration test",
    householdId: ids.householdId,
    createdBy: ids.createdBy,
    assignment: {
        strategy: "fixed",
        assignedTo: ids.userId
    },
    schedule: {
        frequency: "daily",
        interval: 1,
        weekdays: [],
        dayOfMonth: null,
        month: null,
        monthlyRule: null
    },
    metadata: {
        category: "cleaning",
        difficulty: 3,
        estimatedDuration: 20,
        tags: ["integration"]
    },
    notification: {
        enabled: false,
        reminderOffset: {
            value: null,
            unit: null
        }
    },
    activePeriod: {
        startsAt: new Date("2026-09-25T00:00:00.000Z"),
        endsAt: null
    },
    schedulerMetadata: {
        nextRunAt: new Date("2026-09-26T00:00:00.000Z"),
        lastProcessedAt: null,
        processingLeaseUntil: null
    },
    ...overrides
});

describeIntegration("MongoDB recurring chore integration", async (t) => {
    await t.test("connects to the configured test database", async () => {
        Chore = (await import("../../src/models/Chore.js")).default;
        Membership = (await import("../../src/models/Membership.js")).default;
        RecurringChoreTemplate =
            (await import("../../src/models/RecurringChoreTemplate.js")).default;

        ({ processTemplate, generateOccurrence } =
            require("../../src/services/recurringChore.service.cjs"));
        ({ runSchedulerTick } =
            require("../../src/services/recurringScheduler.service.cjs"));

        await mongoose.connect(MONGO_URI);
        assert.equal(mongoose.connection.readyState, 1);
    });

    await t.test("creates one occurrence and enforces recurring identity", async () => {
        const template = makeTemplate();

        await Membership.create({
            userId: ids.userId,
            householdId: ids.householdId,
            role: "member"
        });

        await RecurringChoreTemplate.create(template);

        const recurrenceUtils = {
            getDailyOccurrences: () => [
                new Date("2026-09-26T00:00:00.000Z")
            ]
        };

        const first = await processTemplate(
            template,
            new Date("2026-09-26T12:00:00.000Z"),
            { recurrenceUtils }
        );

        assert.equal(first.occurrencesProcessed, 1);

        const count = await Chore.countDocuments({
            recurringTemplateId: template._id,
            occurrenceDate: new Date("2026-09-26T00:00:00.000Z")
        });

        assert.equal(count, 1);

        const duplicate = await Chore.create({
            title: template.title,
            description: template.description,
            householdId: template.householdId,
            assignedTo: template.assignment.assignedTo,
            createdBy: template.createdBy,
            choreType: "recurring",
            recurringTemplateId: template._id,
            occurrenceDate: new Date("2026-09-26T00:00:00.000Z"),
            generationType: "manual",
            completionStatus: "pending",
            approvalStatus: "approved",
            source: "admin-assigned",
            approvedDifficulty: 3,
            dueDate: new Date("2026-09-26T00:00:00.000Z")
        }).catch((error) => error);

        assert.equal(duplicate.code, 11000);

        await Chore.deleteMany({
            recurringTemplateId: template._id
        });
        await RecurringChoreTemplate.deleteOne({
            _id: template._id
        });
    });

    await t.test("existing occurrence is idempotent even after fixed assignee leaves", async () => {
        const template = makeTemplate({
            _id: new mongoose.Types.ObjectId(),
            title: "Idempotent retry " + crypto.randomUUID().slice(0, 8),
            assignment: {
                strategy: "fixed",
                assignedTo: ids.idempotencyUserId
            }
        });

        await RecurringChoreTemplate.create(template);
        await Membership.create({
            userId: ids.idempotencyUserId,
            householdId: ids.householdId,
            role: "member"
        });

        const first = await generateOccurrence(
            template,
            new Date("2026-09-27T00:00:00.000Z")
        );

        assert.equal(first.created, true);

        await Membership.deleteOne({
            userId: ids.idempotencyUserId,
            householdId: ids.householdId
        });

        const retry = await generateOccurrence(
            template,
            new Date("2026-09-27T00:00:00.000Z")
        );

        assert.equal(retry.created, false);
        assert.equal(retry.idempotent, true);
        assert.equal(
            retry.chore._id.toString(),
            first.chore._id.toString()
        );

        await Chore.deleteMany({
            recurringTemplateId: template._id
        });
        await RecurringChoreTemplate.deleteOne({
            _id: template._id
        });
    });

    await t.test("scheduler persists nextRunAt and clears its lease", async () => {
        const template = makeTemplate({
            _id: new mongoose.Types.ObjectId(),
            title: "Scheduler integration " + crypto.randomUUID().slice(0, 8),
            schedulerMetadata: {
                nextRunAt: new Date("2026-09-26T00:00:00.000Z"),
                lastProcessedAt: null,
                processingLeaseUntil: null
            }
        });

        await RecurringChoreTemplate.create(template);

        const result = await runSchedulerTick(
            new Date("2026-09-26T12:00:00.000Z"),
            { TemplateModel: RecurringChoreTemplate }
        );

        assert.equal(result.processed, 1);
        assert.equal(result.failed, 0);

        const saved = await RecurringChoreTemplate.findById(template._id).lean();

        assert.ok(saved);
        assert.equal(saved.schedulerMetadata.processingLeaseUntil, null);
        assert.ok(saved.schedulerMetadata.lastProcessedAt instanceof Date);
        assert.ok(saved.schedulerMetadata.nextRunAt instanceof Date);
        assert.ok(saved.schedulerMetadata.nextRunAt > new Date("2026-09-26T12:00:00.000Z"));
    });

    await t.test("scheduler persists null when the template has no future occurrence", async () => {
        const template = makeTemplate({
            _id: new mongoose.Types.ObjectId(),
            title: "Final occurrence " + crypto.randomUUID().slice(0, 8),
            activePeriod: {
                startsAt: new Date("2026-09-26T00:00:00.000Z"),
                endsAt: new Date("2026-09-26T23:59:59.000Z")
            },
            schedulerMetadata: {
                nextRunAt: new Date("2026-09-26T00:00:00.000Z"),
                lastProcessedAt: null,
                processingLeaseUntil: null
            }
        });

        await RecurringChoreTemplate.create(template);

        const result = await runSchedulerTick(
            new Date("2026-09-26T12:00:00.000Z"),
            { TemplateModel: RecurringChoreTemplate }
        );

        assert.ok(result.processed >= 1);

        const saved = await RecurringChoreTemplate.findById(template._id).lean();

        assert.ok(saved);
        assert.equal(saved.schedulerMetadata.nextRunAt, null);
        assert.equal(saved.schedulerMetadata.processingLeaseUntil, null);
        assert.ok(saved.schedulerMetadata.lastProcessedAt instanceof Date);
    });

    t.after(async () => {
        await Chore?.deleteMany({ householdId: ids.householdId });
        await Membership?.deleteMany({ householdId: ids.householdId });
        await RecurringChoreTemplate?.deleteMany({ householdId: ids.householdId });
        await mongoose.disconnect();
    });
});
