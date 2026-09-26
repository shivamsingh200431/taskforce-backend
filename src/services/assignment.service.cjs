const workloadService = require("./workload.service.cjs");

const getMembershipModel = async (MembershipModel) =>
    MembershipModel || (await import("../models/Membership.js")).default;

const HISTORY_WINDOWS = Object.freeze({
    daily: 7,
    weekly: 7,
    monthly: 30,
    yearly: 30
});

const getHistoryWindowDays = (frequency) => {
    return HISTORY_WINDOWS[frequency] || 30;
};

const toComparableId = (value) => value?.toString?.() ?? String(value);

const resolveFixedAssignee = async (
    template,
    { MembershipModel } = {}
) => {
    MembershipModel = await getMembershipModel(MembershipModel);

    const assignedTo = template.assignment?.assignedTo;

    if (!assignedTo) {
        return {
            ok: false,
            reason: "fixed_assignee_not_configured"
        };
    }

    const membershipQuery = MembershipModel.findOne({
        userId: assignedTo,
        householdId: template.householdId
    });

    const membership = typeof membershipQuery?.lean === "function"
        ? await membershipQuery.lean()
        : await membershipQuery;

    if (!membership) {
        return {
            ok: false,
            reason: "fixed_assignee_not_eligible"
        };
    }

    return {
        ok: true,
        assignee: assignedTo
    };
};

const resolveRotationAssignee = async (
    template,
    now = new Date(),
    {
        MembershipModel,
        workloadService: workload = workloadService
    } = {}
) => {
    MembershipModel = await getMembershipModel(MembershipModel);

    const members = await MembershipModel.find({
        householdId: template.householdId
    }).lean();

    if (members.length === 0) {
        return {
            ok: false,
            reason: "no_eligible_members"
        };
    }

    const windowStart = new Date(now);
    windowStart.setUTCDate(
        windowStart.getUTCDate() -
        getHistoryWindowDays(template.schedule?.frequency)
    );

    let statsByUserId;

    if (typeof workload.getRotationWorkloadStats === "function") {
        statsByUserId = await workload.getRotationWorkloadStats(
            members.map((member) => member.userId),
            template.householdId,
            windowStart
        );
    }

    const rankings = members.map((member) => {
        const userId = member.userId;
        const stats = statsByUserId?.get(toComparableId(userId));

        if (stats) {
            return {
                userId,
                workloadCount: stats.workloadCount,
                workloadPoints: stats.workloadPoints,
                recentAssignments: stats.recentAssignments,
                recentDifficulty: stats.recentDifficulty
            };
        }

        return {
            userId,
            workloadCount: 0,
            workloadPoints: 0,
            recentAssignments: 0,
            recentDifficulty: 0
        };
    });

    rankings.sort((a, b) =>
        a.workloadCount - b.workloadCount ||
        a.workloadPoints - b.workloadPoints ||
        a.recentAssignments - b.recentAssignments ||
        a.recentDifficulty - b.recentDifficulty ||
        toComparableId(a.userId).localeCompare(toComparableId(b.userId))
    );

    return {
        ok: true,
        assignee: rankings[0].userId
    };
};

const resolveAssignee = async (
    template,
    now = new Date(),
    options = {}
) => {
    const strategy = template.assignment?.strategy;

    if (strategy === "fixed") {
        return resolveFixedAssignee(template, options);
    }

    if (strategy === "rotation") {
        return resolveRotationAssignee(template, now, options);
    }

    return {
        ok: false,
        reason: "unsupported_assignment_strategy"
    };
};

module.exports = {
    HISTORY_WINDOWS,
    getHistoryWindowDays,
    resolveFixedAssignee,
    resolveRotationAssignee,
    resolveAssignee
};
