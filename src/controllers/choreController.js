import Chore from "../models/Chore.js";
import Membership from "../models/Membership.js";
import { isMember, isAdmin } from "../utils/householdPermissions.js";

const appendReviewHistory = (chore, action, actorId, feedback = "") => {
    if (!Array.isArray(chore.reviewHistory)) {
        chore.reviewHistory = [];
    }

    chore.reviewHistory.push({
        action,
        actorId,
        feedback
    });
};

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

        const member = await isMember(req.user._id, householdId);
        if (!member) {
            return res.status(403).json({
                message: "You are not a member of this household"
            });
        }

        const membership = await Membership.findOne({
            userId: req.user._id,
            householdId
        });

        const choreData = {
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

            const assignedUserIsMember = await isMember(
                assignedTo,
                householdId
            );

            if (!assignedUserIsMember) {
                return res.status(400).json({
                    message: "Assigned user must belong to this household"
                });
            }

            choreData.assignedTo = assignedTo;
            choreData.approvalStatus = "approved";
            choreData.source = "admin-assigned";
            choreData.approvedDifficulty = suggestedDifficulty;
        } else {
            choreData.assignedTo = req.user._id;
            choreData.approvalStatus = "pending";
            choreData.source = "member-submitted";
            choreData.suggestedDifficulty = suggestedDifficulty;
            choreData.reviewHistory = [{
                action: "submitted",
                actorId: req.user._id,
                feedback: ""
            }];
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
        res.status(500).json({ message: "Server error" });
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

        const member = await isMember(req.user._id, householdId);
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
            .populate("reviewHistory.actorId", "username")
            .sort({ createdAt: -1 });

        const formattedChores = chores.map((chore) => ({
            id: chore._id,
            title: chore.title,
            description: chore.description,
            assignedTo: chore.assignedTo?.username,
            createdBy: chore.createdBy?.username,
            choreType: chore.choreType,
            completionStatus: chore.completionStatus,
            approvalStatus: chore.approvalStatus,
            source: chore.source,
            feedback: chore.feedback,
            suggestedDifficulty: chore.suggestedDifficulty,
            approvedDifficulty: chore.approvedDifficulty,
            dueDate: chore.dueDate,
            reviewHistory: (chore.reviewHistory || []).map((entry) => ({
                action: entry.action,
                actorId: entry.actorId?._id || entry.actorId,
                actor: entry.actorId?.username,
                feedback: entry.feedback,
                createdAt: entry.createdAt
            }))
        }));

        res.status(200).json({ chores: formattedChores });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
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

        if (!await isAdmin(req.user._id, chore.householdId)) {
            return res.status(403).json({
                message: "Admin access required"
            });
        }

        if (chore.source !== "member-submitted") {
            return res.status(400).json({
                message: "Only member-submitted chores can be reviewed."
            });
        }

        if (chore.approvalStatus !== "pending") {
            return res.status(400).json({
                message: "Chore has already been reviewed"
            });
        }

        if (needsImprovement !== undefined && typeof needsImprovement !== "boolean") {
            return res.status(400).json({
                message: "needsImprovement must be a boolean"
            });
        }

        if (feedback !== undefined && typeof feedback !== "string") {
            return res.status(400).json({
                message: "feedback must be a string"
            });
        }

        if (title) chore.title = title;
        if (description) chore.description = description;
        if (approvedDifficulty !== undefined) chore.approvedDifficulty = approvedDifficulty;

        const decision = needsImprovement === true
            ? "needs-improvement"
            : "approved";
        chore.approvalStatus = decision;
        chore.completionStatus = decision === "approved"
            ? "completed"
            : "pending";
        chore.feedback = feedback?.trim?.() || "";

        appendReviewHistory(
            chore,
            decision,
            req.user._id,
            chore.feedback
        );

        await chore.save();

        res.status(200).json({
            message: "Chore approved successfully",
            chore
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
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

        if (!await isAdmin(req.user._id, chore.householdId)) {
            return res.status(403).json({
                message: "Admin access required"
            });
        }

        if (chore.source !== "member-submitted") {
            return res.status(400).json({
                message: "Only member-submitted chores can be reviewed."
            });
        }

        if (chore.approvalStatus !== "pending") {
            return res.status(400).json({
                message: "Chore has already been reviewed"
            });
        }

        if (feedback !== undefined && typeof feedback !== "string") {
            return res.status(400).json({
                message: "feedback must be a string"
            });
        }

        chore.approvalStatus = "rejected";
        chore.feedback = feedback?.trim?.() || "";
        appendReviewHistory(
            chore,
            "rejected",
            req.user._id,
            chore.feedback
        );

        await chore.save();

        res.status(200).json({
            message: "Chore rejected successfully",
            chore
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const resubmitChore = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            suggestedDifficulty
        } = req.body;

        const chore = await Chore.findById(id);
        if (!chore) {
            return res.status(404).json({
                message: "Chore not found"
            });
        }

        if (!chore.assignedTo.equals(req.user._id)) {
            return res.status(403).json({
                message: "Only the submitting member can resubmit this chore."
            });
        }

        if (!await isMember(req.user._id, chore.householdId)) {
            return res.status(403).json({
                message: "You are no longer a member of this household."
            });
        }

        if (chore.source !== "member-submitted") {
            return res.status(400).json({
                message: "Only member-submitted chores can be resubmitted."
            });
        }

        if (!["needs-improvement", "rejected"].includes(chore.approvalStatus)) {
            return res.status(400).json({
                message: "Only rejected or needs-improvement chores can be resubmitted."
            });
        }

        if (title !== undefined) {
            if (
                typeof title !== "string" ||
                title.trim().length < 3 ||
                title.trim().length > 100
            ) {
                return res.status(400).json({
                    message: "title must be a string between 3 and 100 characters"
                });
            }
            chore.title = title.trim();
        }

        if (description !== undefined) {
            if (typeof description !== "string") {
                return res.status(400).json({
                    message: "description must be a string"
                });
            }
            chore.description = description.trim();
        }

        if (suggestedDifficulty !== undefined) {
            if (
                typeof suggestedDifficulty !== "number" ||
                !Number.isFinite(suggestedDifficulty) ||
                suggestedDifficulty < 1 ||
                suggestedDifficulty > 5
            ) {
                return res.status(400).json({
                    message: "suggestedDifficulty must be a number between 1 and 5"
                });
            }
            chore.suggestedDifficulty = suggestedDifficulty;
        }

        chore.approvalStatus = "pending";
        chore.completionStatus = "pending";
        chore.approvedDifficulty = undefined;
        chore.feedback = "";

        appendReviewHistory(
            chore,
            "resubmitted",
            req.user._id
        );

        await chore.save();

        return res.status(200).json({
            message: "Chore resubmitted successfully",
            chore
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "Invalid chore data",
                errors: Object.values(error.errors).map((item) => item.message)
            });
        }

        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const completeChore = async (req, res) => {
    try {
        const { id } = req.params;
        const chore = await Chore.findById(id);

        if (!chore) {
            return res.status(404).json({
                message: "Chore not found"
            });
        }

        if (!chore.assignedTo.equals(req.user._id)) {
            return res.status(403).json({
                message: "Only the assigned member can complete this chore."
            });
        }

        if (chore.source !== "admin-assigned") {
            return res.status(400).json({
                message: "Member-submitted chores are completed through admin review."
            });
        }

        if (chore.approvalStatus !== "approved") {
            return res.status(400).json({
                message: "This chore is not approved."
            });
        }

        if (chore.completionStatus !== "pending") {
            return res.status(400).json({
                message: "This chore has already been completed."
            });
        }

        chore.completionStatus = "completed";
        await chore.save();

        return res.status(200).json({
            message: "Chore marked as completed successfully.",
            chore
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export {
    createChore,
    getChores,
    approveChore,
    rejectChore,
    resubmitChore,
    completeChore
};
