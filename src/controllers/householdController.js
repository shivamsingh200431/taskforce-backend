const Household = require("../models/Household");
const Membership = require("../models/Membership");

const createHousehold = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Household name is required"
            });
        }

        if (name.length < 3 || name.length > 50) {
            return res.status(400).json({
                message: "Household name must be between 3 and 50 characters"
            });
        }

        const existingHousehold = await Household.findOne({
            createdBy: req.user._id,
            name: name.trim()
        });

        if (existingHousehold) {
            return res.status(400).json({
                message: "You already have a household with this name"
            });
        }

        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        let inviteCode = "";

        for (let i = 0; i < 8; i++) {
            inviteCode += characters.charAt(
                Math.floor(Math.random() * characters.length)
            );
        }

        const household = await Household.create({
            name: name.trim(),
            inviteCode,
            createdBy: req.user._id
        });

        await Membership.create({
            userId: req.user._id,
            householdId: household._id,
            role: "admin"
        });

        res.status(201).json({
    message: "Household created successfully",
    household: {
        id: household._id,
        name: household.name,
        inviteCode: household.inviteCode
    }
});

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};



const joinHousehold = async (req, res) => {
    try {
        const { inviteCode } = req.body;

        if (!inviteCode) {
            return res.status(400).json({
                message: "Invite code is required"
            });
        }

        const household = await Household.findOne({
            inviteCode: inviteCode.trim().toUpperCase()
        });

        if (!household) {
            return res.status(404).json({
                message: "Invalid invite code"
            });
        }

        const existingMembership = await Membership.findOne({
            userId: req.user._id,
            householdId: household._id
        });

        if (existingMembership) {
            return res.status(400).json({
                message: "You are already a member of this household"
            });
        }

        const membership = await Membership.create({
            userId: req.user._id,
            householdId: household._id,
            role: "member"
        });

        res.status(201).json({
            message: "Joined household successfully",
            membership: {
                id: membership._id,
                role: membership.role
            },
            household: {
                id: household._id,
                name: household.name
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


const getMyHouseholds = async (req, res) => {
    try {

        const memberships = await Membership.find({
            userId: req.user._id
        }).populate("householdId");

        const households = memberships.map((membership) => ({
            id: membership.householdId._id,
            name: membership.householdId.name,
            role: membership.role
        }));

        res.status(200).json({
            households
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createHousehold,
    joinHousehold,
    getMyHouseholds
};