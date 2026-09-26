const assert = require("node:assert/strict");
const test = require("node:test");

const {
    claimTemplate,
    completeClaim,
    runSchedulerTick
} = require("../../src/services/recurringScheduler.service.cjs");

test("atomic claim accepts a due template and sets a five-minute lease", async () => {
    let received;

    const model = {
        findOneAndUpdate: async (filter, update, options) => {
            received = { filter, update, options };
            return { _id: "template-1" };
        }
    };

    const now = new Date("2026-09-26T10:00:00.000Z");
    const result = await claimTemplate("template-1", now, {
        TemplateModel: model,
        leaseMs: 5 * 60 * 1000
    });

    assert.equal(result._id, "template-1");
    assert.equal(
        received.update.$set["schedulerMetadata.processingLeaseUntil"].toISOString(),
        "2026-09-26T10:05:00.000Z"
    );
    assert.equal(received.options.returnDocument, "after");
});

test("atomic claim allows an expired lease to be recovered", async () => {
    let received;

    const model = {
        findOneAndUpdate: async (filter) => {
            received = filter;
            return { _id: "template-1" };
        }
    };

    const now = new Date("2026-09-26T10:00:00.000Z");

    await claimTemplate("template-1", now, {
        TemplateModel: model,
        leaseMs: 5 * 60 * 1000
    });

    const leaseConditions =
        received.$and[1].$or;

    assert.deepEqual(leaseConditions, [
        { "schedulerMetadata.processingLeaseUntil": null },
        { "schedulerMetadata.processingLeaseUntil": { $lte: now } }
    ]);
});

test("completion only clears a lease that still belongs to the claim", async () => {
    let received;

    const model = {
        updateOne: async (filter, update) => {
            received = { filter, update };
            return { matchedCount: 1 };
        }
    };

    const leaseUntil = new Date("2026-09-26T10:05:00.000Z");

    const result = await completeClaim(
        "template-1",
        leaseUntil,
        {
            nextRunAt: new Date("2026-09-27T10:00:00.000Z"),
            lastProcessedAt: new Date("2026-09-26T10:00:00.000Z")
        },
        { TemplateModel: model }
    );

    assert.equal(result.matchedCount, 1);
    assert.equal(received.filter._id, "template-1");
    assert.equal(
        received.filter["schedulerMetadata.processingLeaseUntil"],
        leaseUntil
    );
    assert.equal(
        received.update.$set["schedulerMetadata.processingLeaseUntil"],
        null
    );
});

test("completion persists an explicit null nextRunAt", async () => {
    let received;

    const model = {
        updateOne: async (filter, update) => {
            received = { filter, update };
            return { matchedCount: 1 };
        }
    };

    const leaseUntil = new Date("2026-09-26T10:05:00.000Z");

    await completeClaim(
        "template-1",
        leaseUntil,
        {
            nextRunAt: null,
            lastProcessedAt: new Date("2026-09-26T10:00:00.000Z")
        },
        { TemplateModel: model }
    );

    assert.equal(
        received.update.$set["schedulerMetadata.nextRunAt"],
        null
    );
    assert.equal(
        received.update.$set["schedulerMetadata.processingLeaseUntil"],
        null
    );
});

test("scheduler isolates template failures", async () => {
    const claimed = ["template-1", "template-2"];
    const processed = [];

    const TemplateModel = {
        find: async () => claimed.map((_id) => ({ _id })),
        findOneAndUpdate: async (filter) => ({ _id: filter._id }),
        updateOne: async () => ({ matchedCount: 1 })
    };

    const result = await runSchedulerTick(
        new Date("2026-09-26T10:00:00.000Z"),
        {
            TemplateModel,
            processTemplateFn: async (template) => {
                processed.push(template._id);
                if (template._id === "template-1") {
                    throw new Error("simulated failure");
                }

                return {
                    nextRunAt: new Date("2026-09-27T10:00:00.000Z"),
                    lastProcessedAt: new Date("2026-09-26T10:00:00.000Z")
                };
            }
        }
    );

    assert.deepEqual(processed, claimed);
    assert.equal(result.processed, 1);
    assert.equal(result.failed, 1);
});
