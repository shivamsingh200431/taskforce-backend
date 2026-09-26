const assert = require("node:assert/strict");
const test = require("node:test");

const workload = require("../../src/services/workload.service.cjs");

const makeFindModel = (chores) => ({
    lastQuery: null,
    find(query) {
        this.lastQuery = query;
        return {
            lean: async () => chores
        };
    },
    countDocuments(query) {
        this.lastQuery = query;
        return Promise.resolve(chores.length);
    }
});

test("difficulty points map 1-5 to 10-50", () => {
    assert.deepEqual(workload.DIFFICULTY_POINTS, {
        1: 10,
        2: 20,
        3: 30,
        4: 40,
        5: 50
    });
    assert.equal(workload.difficultyPointsFor(3), 30);
    assert.equal(workload.difficultyPointsFor(undefined), 0);
});

test("current workload counts approved pending/overdue chores and difficulty points", async () => {
    const model = makeFindModel([
        { approvedDifficulty: 3 },
        { suggestedDifficulty: 2 },
        { approvedDifficulty: 5 }
    ]);

    const result = await workload.getCurrentWorkload(
        "user",
        "household",
        { ChoreModel: model }
    );

    assert.deepEqual(result, {
        count: 3,
        difficultyPoints: 100
    });
});

test("recent assignment burden counts only chores in the requested window", async () => {
    const model = makeFindModel([{}, {}, {}]);

    const result = await workload.getRecentAssignmentBurden(
        "user",
        "household",
        new Date("2026-09-01"),
        { ChoreModel: model }
    );

    assert.equal(result, 3);
    assert.equal(model.lastQuery.approvalStatus, "approved");
});

test("recent difficulty burden sums the same difficulty-point mapping", async () => {
    const model = makeFindModel([
        { approvedDifficulty: 4 },
        { suggestedDifficulty: 1 },
        { approvedDifficulty: 2 }
    ]);

    const result = await workload.getRecentDifficultyBurden(
        "user",
        "household",
        new Date("2026-09-01"),
        { ChoreModel: model }
    );

    assert.equal(result, 70);
    assert.equal(model.lastQuery.approvalStatus, "approved");
});
