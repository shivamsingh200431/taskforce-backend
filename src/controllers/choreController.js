const Chore = require("../models/Chore");
const Membership = require("../models/Membership");

const {
    isMember
} = require("../utils/householdPermissions");

const createChore = async (req, res) => {
    try {

        const {
            title,
            description,
            householdId,
            assignedTo,
            choreType,
            suggestedDifficulty,
            dueDate
        } = req.body;

        if (!title || !householdId || !choreType) {
            return res.status(400).json({
                message: "Title, householdId and choreType are required"
            });
        }

        const member = await isMember(
            req.user._id,
            householdId
        );

        if (!member) {
            return res.status(403).json({
                message: "You are not a member of this household"
            });
        }

        const membership = await Membership.findOne({
            userId: req.user._id,
            householdId
        });

        let choreData = {
            title,
            description,
            householdId,
            createdBy: req.user._id,
            choreType,
            dueDate
        };

        if (membership.role === "admin") {

            if (!assignedTo) {
                return res.status(400).json({
                    message: "assignedTo is required"
                });
            }

            choreData.assignedTo = assignedTo;

            choreData.approvalStatus = "approved";

            choreData.approvedDifficulty =
                suggestedDifficulty;

        } else {

            choreData.assignedTo = req.user._id;

            choreData.approvalStatus = "pending";

            choreData.suggestedDifficulty =
                suggestedDifficulty;
        }

        const chore = await Chore.create(choreData);

        res.status(201).json({
            message: "Chore created successfully",
            chore: {
                id: chore._id,
                title: chore.title,
                approvalStatus: chore.approvalStatus
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });

    }
};

module.exports = {
    createChore
};