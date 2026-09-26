import assert from "node:assert/strict";
import mongoose from "mongoose";
import RecurringChoreTemplate from "../../src/models/RecurringChoreTemplate.js";

const ids = {
    householdId: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
};

test("scheduler processing lease defaults to null", () => {
    const template = new RecurringChoreTemplate({
        title: "Take out trash",
        householdId: ids.householdId,
        createdBy: ids.userId,
    });

    assert.equal(template.schedulerMetadata.processingLeaseUntil, null);
});
