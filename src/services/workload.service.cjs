const Chore = require("../models/Chore");

const DIFFICULTY_POINTS = Object.freeze({
    1: 10,
    2: 20,
    3: 30,
    4: 40,
    5: 50
});

const OUTSTANDING_STATUSES = ["pending", "overdue"];

const difficultyPointsFor = (difficulty) => {
    return DIFFICULTY_POINTS[difficulty] || 0;
};

const getDifficulty = (chore) => {
    return chore.approvedDifficulty ?? chore.suggestedDifficulty;
};

const getCurrentWorkload = async (
    userId,
    householdId,
    { ChoreModel = Chore } = {}
) => {
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

const getRecentAssignmentBurden = async (
    userId,
    householdId,
    windowStart,
    { ChoreModel = Chore } = {}
) => {
    const count = await ChoreModel.countDocuments({
        assignedTo: userId,
        householdId,
        createdAt: { $gte: windowStart }
    });

    return count;
};

const getRecentDifficultyBurden = async (
    userId,
    householdId,
    windowStart,
    { ChoreModel = Chore } = {}
) => {
    const chores = await ChoreModel.find({
        assignedTo: userId,
        householdId,
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
    getRecentAssignmentBurden,
    getRecentDifficultyBurden
};
