const getChoreModel = async (ChoreModel) =>
    ChoreModel || (await import("../models/Chore.js")).default;

const DIFFICULTY_POINTS = Object.freeze({
    1: 10,
    2: 20,
    3: 30,
    4: 40,
    5: 50
});

const OUTSTANDING_STATUSES = ["pending", "overdue"];

const toUserKey = (value) => value?.toString?.() ?? String(value);

const difficultyPointsFor = (difficulty) => {
    return DIFFICULTY_POINTS[difficulty] || 0;
};

const getDifficulty = (chore) => {
    return chore.approvedDifficulty ?? chore.suggestedDifficulty;
};

const getCurrentWorkload = async (
    userId,
    householdId,
    { ChoreModel } = {}
) => {
    ChoreModel = await getChoreModel(ChoreModel);

    const chores = await ChoreModel.find({
        assignedTo: userId,
        householdId,
        approvalStatus: "approved",
        completionStatus: { $in: OUTSTANDING_STATUSES }
    }).lean();

    return chores.reduce(
        (result, chore) => {
            result.count += 1;
            result.difficultyPoints += difficultyPointsFor(
                getDifficulty(chore)
            );
            return result;
        },
        { count: 0, difficultyPoints: 0 }
    );
};

const getRotationWorkloadStats = async (
    userIds,
    householdId,
    windowStart,
    { ChoreModel } = {}
) => {
    ChoreModel = await getChoreModel(ChoreModel);

    const stats = new Map(
        userIds.map((userId) => [
            toUserKey(userId),
            {
                workloadCount: 0,
                workloadPoints: 0,
                recentAssignments: 0,
                recentDifficulty: 0
            }
        ])
    );

    const currentChores = await ChoreModel.find({
        assignedTo: { $in: userIds },
        householdId,
        approvalStatus: "approved",
        completionStatus: { $in: OUTSTANDING_STATUSES }
    }).lean();

    for (const chore of currentChores) {
        const entry = stats.get(toUserKey(chore.assignedTo));
        if (!entry) {
            continue;
        }

        entry.workloadCount += 1;
        entry.workloadPoints += difficultyPointsFor(
            getDifficulty(chore)
        );
    }

    const recentChores = await ChoreModel.find({
        assignedTo: { $in: userIds },
        householdId,
        approvalStatus: "approved",
        createdAt: { $gte: windowStart }
    }).lean();

    for (const chore of recentChores) {
        const entry = stats.get(toUserKey(chore.assignedTo));
        if (!entry) {
            continue;
        }

        entry.recentAssignments += 1;
        entry.recentDifficulty += difficultyPointsFor(
            getDifficulty(chore)
        );
    }

    return stats;
};

const getRecentAssignmentBurden = async (
    userId,
    householdId,
    windowStart,
    { ChoreModel } = {}
) => {
    ChoreModel = await getChoreModel(ChoreModel);

    return ChoreModel.countDocuments({
        assignedTo: userId,
        householdId,
        approvalStatus: "approved",
        createdAt: { $gte: windowStart }
    });
};

const getRecentDifficultyBurden = async (
    userId,
    householdId,
    windowStart,
    { ChoreModel } = {}
) => {
    ChoreModel = await getChoreModel(ChoreModel);

    const chores = await ChoreModel.find({
        assignedTo: userId,
        householdId,
        approvalStatus: "approved",
        createdAt: { $gte: windowStart }
    }).lean();

    return chores.reduce(
        (total, chore) => total + difficultyPointsFor(getDifficulty(chore)),
        0
    );
};

module.exports = {
    DIFFICULTY_POINTS,
    OUTSTANDING_STATUSES,
    difficultyPointsFor,
    getCurrentWorkload,
    getRotationWorkloadStats,
    getRecentAssignmentBurden,
    getRecentDifficultyBurden
};
