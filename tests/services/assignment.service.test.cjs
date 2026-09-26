const assert = require("node:assert/strict");
const test = require("node:test");

const {
    resolveFixedAssignee,
    resolveRotationAssignee,
    resolveAssignee,
    getHistoryWindowDays
} = require("../../src/services/assignment.service.cjs");

const makeMembershipModel = ({ members = [], fixedMember = null }) => ({
    findOne() {
        return {
            lean: async () => fixedMember
        };
    },
    find() {
        return {
            lean: async () => members
        };
    }
});

const template = (overrides = {}) => ({
    householdId: "household-1",
    assignment: {
        strategy: "rotation",
        assignedTo: null
    },
    schedule: {
        frequency: "weekly"
    },
    ...overrides
});

test("fixed assignment succeeds for an eligible household member", async () => {
    const result = await resolveFixedAssignee(
        template({
            assignment: {
                strategy: "fixed",
                assignedTo: "user-1"
            }
        }),
        {
            MembershipModel: makeMembershipModel({
                fixedMember: { userId: "user-1", householdId: "household-1" }
            })
        }
    );

    assert.deepEqual(result, {
        ok: true,
        assignee: "user-1"
    });
});

test("fixed assignment fails when configured member is no longer in household", async () => {
    const result = await resolveFixedAssignee(
        template({
            assignment: {
                strategy: "fixed",
                assignedTo: "user-1"
            }
        }),
        {
            MembershipModel: makeMembershipModel()
        }
    );

    assert.equal(result.ok, false);
    assert.equal(result.reason, "fixed_assignee_not_eligible");
});

test("rotation chooses the lowest current workload", async () => {
    const members = [
        { userId: "user-b" },
        { userId: "user-a" }
    ];

    const result = await resolveRotationAssignee(
        template(),
        new Date("2026-09-26T00:00:00.000Z"),
        {
            MembershipModel: makeMembershipModel({ members }),
            workloadService: {
                getCurrentWorkload: async (id) =>
                    id === "user-a"
                        ? { count: 1, difficultyPoints: 10 }
                        : { count: 2, difficultyPoints: 20 },
                getRecentAssignmentBurden: async () => 0,
                getRecentDifficultyBurden: async () => 0
            }
        }
    );

    assert.equal(result.ok, true);
    assert.equal(result.assignee, "user-a");
});

test("rotation uses recent assignment burden as the second ranking key", async () => {
    const members = [
        { userId: "user-a" },
        { userId: "user-b" }
    ];

    const result = await resolveRotationAssignee(
        template(),
        new Date("2026-09-26T00:00:00.000Z"),
        {
            MembershipModel: makeMembershipModel({ members }),
            workloadService: {
                getCurrentWorkload: async () => ({ count: 1, difficultyPoints: 10 }),
                getRecentAssignmentBurden: async (id) =>
                    id === "user-a" ? 3 : 1,
                getRecentDifficultyBurden: async () => 0
            }
        }
    );

    assert.equal(result.assignee, "user-b");
});

test("rotation uses recent difficulty burden as the third ranking key", async () => {
    const members = [
        { userId: "user-a" },
        { userId: "user-b" }
    ];

    const result = await resolveRotationAssignee(
        template(),
        new Date("2026-09-26T00:00:00.000Z"),
        {
            MembershipModel: makeMembershipModel({ members }),
            workloadService: {
                getCurrentWorkload: async () => ({ count: 1, difficultyPoints: 10 }),
                getRecentAssignmentBurden: async () => 1,
                getRecentDifficultyBurden: async (id) =>
                    id === "user-a" ? 40 : 20
            }
        }
    );

    assert.equal(result.assignee, "user-b");
});

test("rotation uses deterministic user id ordering as the final tie-breaker", async () => {
    const members = [
        { userId: "user-b" },
        { userId: "user-a" }
    ];

    const result = await resolveRotationAssignee(
        template(),
        new Date("2026-09-26T00:00:00.000Z"),
        {
            MembershipModel: makeMembershipModel({ members }),
            workloadService: {
                getCurrentWorkload: async () => ({ count: 1, difficultyPoints: 10 }),
                getRecentAssignmentBurden: async () => 1,
                getRecentDifficultyBurden: async () => 20
            }
        }
    );

    assert.equal(result.assignee, "user-a");
});

test("daily/weekly use a 7-day history window and monthly/yearly use 30 days", () => {
    assert.equal(getHistoryWindowDays("daily"), 7);
    assert.equal(getHistoryWindowDays("weekly"), 7);
    assert.equal(getHistoryWindowDays("monthly"), 30);
    assert.equal(getHistoryWindowDays("yearly"), 30);
});

test("rotation returns a business failure when there are no eligible members", async () => {
    const result = await resolveRotationAssignee(
        template(),
        new Date(),
        {
            MembershipModel: makeMembershipModel({ members: [] }),
            workloadService: {}
        }
    );

    assert.deepEqual(result, {
        ok: false,
        reason: "no_eligible_members"
    });
});

test("resolveAssignee dispatches fixed and rotation strategies", async () => {
    const result = await resolveAssignee(
        template({
            assignment: {
                strategy: "fixed",
                assignedTo: "user-1"
            }
        }),
        new Date(),
        {
            MembershipModel: makeMembershipModel({
                fixedMember: { userId: "user-1" }
            })
        }
    );

    assert.equal(result.ok, true);
    assert.equal(result.assignee, "user-1");
});
