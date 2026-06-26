const Chore = require("../models/Chore");
const Membership = require("../models/Membership");

const {
    isMember,
    isAdmin
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

            const assignedUserIsMember =
    await isMember(
        assignedTo,
        householdId
    );

if (!assignedUserIsMember) {
    return res.status(400).json({
        message:
            "Assigned user must belong to this household"
    });
}

            choreData.assignedTo = assignedTo;

            choreData.approvalStatus = "approved";

            choreData.source = "admin-assigned";

            choreData.approvedDifficulty =
                suggestedDifficulty;

        } else {

            choreData.assignedTo = req.user._id;

            choreData.approvalStatus = "pending";

            choreData.source = "member-submitted";

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

const getChores = async (req, res) => {
    try {

        const { householdId } = req.query;

        if (!householdId) {
            return res.status(400).json({
                message: "householdId is required"
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

        const chores = await Chore.find({
            householdId
        })
        .populate("assignedTo", "username")
        .populate("createdBy", "username")
        .sort({ createdAt: -1 });

        const formattedChores = chores.map(
            (chore) => ({
                id: chore._id,
                title: chore.title,
                description: chore.description,

                assignedTo:
                    chore.assignedTo?.username,

                createdBy:
                    chore.createdBy?.username,

                choreType: chore.choreType,

                status: chore.status,

                approvalStatus:
                    chore.approvalStatus,

                source: chore.source,

                feedback: chore.feedback,

                suggestedDifficulty:
                    chore.suggestedDifficulty,

                approvedDifficulty:
                    chore.approvedDifficulty,

                dueDate: chore.dueDate
            })
        );

        res.status(200).json({
            chores: formattedChores
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });

    }
};

const approveChore = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            title,
            description,
            approvedDifficulty,
            feedback,
            needsImprovement
        } = req.body;

        const chore = await Chore.findById(id);

        if (!chore) {
            return res.status(404).json({
                message: "Chore not found"
            });
        }

        const admin = await isAdmin(
            req.user._id,
            chore.householdId
        );

        if (!admin) {
            return res.status(403).json({
                message: "Admin access required"
            });
        }

        if (chore.approvalStatus !== "pending") {
            return res.status(400).json({
                message: "Chore has already been reviewed"
            });
        }

        if (title) {
            chore.title = title;
        }

        if (description) {
            chore.description = description;
        }

        if (approvedDifficulty) {
            chore.approvedDifficulty =
                approvedDifficulty;
        }

        if (feedback) {
            chore.feedback = feedback;
        }

        chore.approvalStatus = "approved";

        if (
            chore.source === "member-submitted"
        ) {

            chore.status =
                needsImprovement
                    ? "pending"
                    : "completed";

        }

        await chore.save();

        res.status(200).json({
            message: "Chore approved successfully",
            chore
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });

    }
}; 

const rejectChore = async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;

        const chore = await Chore.findById(id);

        if (!chore) {
            return res.status(404).json({
                message: "Chore not found"
            });
        }

        const admin = await isAdmin(
            req.user._id,
            chore.householdId
        );

        if (!admin) {
            return res.status(403).json({
                message: "Admin access required"
            });
        }

        if (chore.approvalStatus !== "pending") {
            return res.status(400).json({
                message: "Chore has already been reviewed"
            });
        }

        chore.approvalStatus = "rejected";

        if (feedback) {
            chore.feedback = feedback;
        }

        await chore.save();

        res.status(200).json({
            message: "Chore rejected successfully",
            chore
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createChore,
    getChores,
    approveChore,
    rejectChore
};