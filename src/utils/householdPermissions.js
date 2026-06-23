const Membership = require("../models/Membership");

const isMember = async (userId, householdId) => {
    const membership = await Membership.findOne({
        userId,
        householdId
    });

    return !!membership;
};

const isAdmin = async (userId, householdId) => {
    const membership = await Membership.findOne({
        userId,
        householdId
    });

    if (!membership) {
        return false;
    }

    return membership.role === "admin";
};

module.exports = {
    isMember,
    isAdmin
};