import Membership from "../models/Membership.js";

export const isMember = async (userId, householdId) => {
    const membership = await Membership.findOne({
        userId,
        householdId
    });

    return !!membership;
};

export const isAdmin = async (userId, householdId) => {
    const membership = await Membership.findOne({
        userId,
        householdId
    });

    return !!membership && membership.role === "admin";
};
