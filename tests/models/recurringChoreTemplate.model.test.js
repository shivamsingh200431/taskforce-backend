import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import RecurringChoreTemplate from "../../src/models/RecurringChoreTemplate.js";

const ids = {
    householdId: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
};

test("scheduler metadata allows no future next run", async () => {
    const template = new RecurringChoreTemplate({
        title: "Take out trash",
        householdId: ids.householdId,
        createdBy: ids.userId,
        assignment: {
            strategy: "rotation",
            assignedTo: null
        },
        schedule: {
            frequency: "weekly",
            interval: 1,
            weekdays: [0],
            dayOfMonth: null,
            month: null,
            monthlyRule: null
        },
        metadata: {
            category: "cleaning",
            difficulty: 3,
            estimatedDuration: 15
        },
        notification: {
            enabled: false,
            reminderOffset: {
                value: null,
                unit: null
            }
        },
        activePeriod: {
            startsAt: new Date("2026-09-26T00:00:00.000Z"),
            endsAt: null
        },
        schedulerMetadata: {
            nextRunAt: null,
            lastProcessedAt: null,
            processingLeaseUntil: null
        }
    });

    assert.equal(template.schedulerMetadata.nextRunAt, null);
    assert.equal(template.schedulerMetadata.processingLeaseUntil, null);
    await assert.doesNotReject(template.validate());
});

test("scheduler processing lease defaults to null", () => {
    const template = new RecurringChoreTemplate({
        title: "Take out trash",
        householdId: ids.householdId,
        createdBy: ids.userId,
    });

    assert.equal(template.schedulerMetadata.processingLeaseUntil, null);
});
