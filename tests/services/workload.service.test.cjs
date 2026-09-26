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

test("rotation workload stats batch current and recent burden in two queries", async () => {
    const queries = [];
    const model = {
        find(query) {
            queries.push(query);
            const chores = query.completionStatus
                ? [
                    { assignedTo: "user-a", approvedDifficulty: 3 },
                    { assignedTo: "user-b", approvedDifficulty: 1 }
                ]
                : [
                    { assignedTo: "user-a", approvedDifficulty: 4 },
                    { assignedTo: "user-b", approvedDifficulty: 2 },
                    { assignedTo: "user-a", approvedDifficulty: 1 }
                ];

            return {
                lean: async () => chores
            };
        }
    };

    const result = await workload.getRotationWorkloadStats(
        ["user-a", "user-b"],
        "household",
        new Date("2026-09-01"),
        { ChoreModel: model }
    );

    assert.equal(queries.length, 2);
    assert.equal(result.get("user-a").workloadCount, 1);
    assert.equal(result.get("user-a").workloadPoints, 30);
    assert.equal(result.get("user-a").recentAssignments, 2);
    assert.equal(result.get("user-a").recentDifficulty, 50);
    assert.equal(result.get("user-b").workloadCount, 1);
    assert.equal(result.get("user-b").workloadPoints, 10);
    assert.equal(result.get("user-b").recentAssignments, 1);
    assert.equal(result.get("user-b").recentDifficulty, 20);
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
