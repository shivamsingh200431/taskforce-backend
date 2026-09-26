const assert = require("node:assert/strict");
const test = require("node:test");

const {
    generateOccurrence,
    processTemplate,
    normalizeOccurrenceDate
} = require("../../src/services/recurringChore.service.cjs");

const template = {
    _id: "template-1",
    title: "Wash dishes",
    description: "Kitchen dishes",
    householdId: "household-1",
    createdBy: "admin-1",
    assignment: { strategy: "fixed", assignedTo: "user-1" },
    schedule: {
        frequency: "daily",
        interval: 1
    },
    metadata: {
        category: "cleaning",
        difficulty: 3,
        estimatedDuration: 20,
        tags: ["kitchen"]
    },
    activePeriod: {
        startsAt: new Date("2026-09-24T00:00:00.000Z"),
        endsAt: null
    },
    schedulerMetadata: {
        nextRunAt: new Date("2026-09-24T00:00:00.000Z"),
        lastProcessedAt: null
    }
};

test("normalizes utility date strings and Date values to Date instances", () => {
    assert.equal(
        normalizeOccurrenceDate("2026-09-26"),
        new Date("2026-09-26T00:00:00.000Z").getTime()
    );
    assert.equal(
        normalizeOccurrenceDate(new Date("2026-09-26T00:00:00.000Z")),
        new Date("2026-09-26T00:00:00.000Z").getTime()
    );
});

test("generated occurrence snapshots template fields and resolved assignee", async () => {
    let created;

    const ChoreModel = {
        create: async (payload) => {
            created = payload;
            return { ...payload, _id: "chore-1" };
        }
    };

    const result = await generateOccurrence(
        template,
        new Date("2026-09-26T00:00:00.000Z"),
        {
            ChoreModel,
            resolveAssigneeFn: async () => ({
                ok: true,
                assignee: "user-1"
            })
        }
    );

    assert.equal(result.created, true);
    assert.equal(created.title, "Wash dishes");
    assert.equal(created.description, "Kitchen dishes");
    assert.equal(created.householdId, "household-1");
    assert.equal(created.assignedTo, "user-1");
    assert.equal(created.createdBy, "admin-1");
    assert.equal(created.choreType, "recurring");
    assert.equal(created.source, "admin-assigned");
    assert.equal(created.approvedDifficulty, 3);
    assert.equal(created.recurringTemplateId, "template-1");
    assert.equal(created.generationType, "normal");
    assert.equal(created.occurrenceDate.toISOString(), "2026-09-26T00:00:00.000Z");
    assert.equal(created.dueDate.toISOString(), "2026-09-26T00:00:00.000Z");
});

test("manual generation uses manual generation type", async () => {
    let created;

    const result = await generateOccurrence(
        template,
        new Date("2026-09-26T00:00:00.000Z"),
        {
            generationType: "manual",
            ChoreModel: {
                create: async (payload) => {
                    created = payload;
                    return payload;
                }
            },
            resolveAssigneeFn: async () => ({
                ok: true,
                assignee: "user-1"
            })
        }
    );

    assert.equal(result.created, true);
    assert.equal(created.generationType, "manual");
});

test("assignment failure prevents an unassigned recurring chore", async () => {
    let createCalled = false;

    const result = await generateOccurrence(
        template,
        new Date("2026-09-26T00:00:00.000Z"),
        {
            ChoreModel: {
                create: async () => {
                    createCalled = true;
                }
            },
            resolveAssigneeFn: async () => ({
                ok: false,
                reason: "no_eligible_members"
            })
        }
    );

    assert.deepEqual(result, {
        created: false,
        reason: "no_eligible_members"
    });
    assert.equal(createCalled, false);
});

test("duplicate occurrence is treated as idempotent success", async () => {
    const existing = { _id: "existing", title: "Wash dishes" };

    const ChoreModel = {
        create: async () => {
            const error = new Error("duplicate");
            error.code = 11000;
            throw error;
        },
        findOne: () => ({
            lean: async () => existing
        })
    };

    const result = await generateOccurrence(
        template,
        new Date("2026-09-26T00:00:00.000Z"),
        {
            ChoreModel,
            resolveAssigneeFn: async () => ({
                ok: true,
                assignee: "user-1"
            })
        }
    );

    assert.equal(result.created, false);
    assert.equal(result.idempotent, true);
    assert.equal(result.chore, existing);
});

test("processTemplate generates all due occurrences and returns scheduler updates", async () => {
    const generated = [];

    const recurrenceUtils = {
        getDailyOccurrences: () => [
            new Date("2026-09-24T00:00:00.000Z"),
            new Date("2026-09-25T00:00:00.000Z"),
            new Date("2026-09-26T00:00:00.000Z")
        ]
    };

    const result = await processTemplate(
        template,
        new Date("2026-09-26T12:00:00.000Z"),
        {
            recurrenceUtils,
            generateOccurrenceFn: async (_template, date, options) => {
                generated.push({
                    date,
                    generationType: options.generationType
                });
                return { created: true };
            }
        }
    );

    assert.equal(generated.length, 3);
    assert.equal(result.lastProcessedAt.toISOString(), "2026-09-26T00:00:00.000Z");
    assert.ok(result.nextRunAt instanceof Date);
});
