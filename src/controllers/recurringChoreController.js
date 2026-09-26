import RecurringChoreTemplate from "../models/RecurringChoreTemplate.js";
import { isMember, isAdmin } from "../utils/householdPermissions.js";
import { generateOccurrence } from "../services/recurringChore.service.cjs";

const createRecurringChore = async (req, res) => {
    try {
        const { householdId, ...body } = req.body;

        if (!householdId || !body.title) {
            return res.status(400).json({
                message: "householdId and title are required"
            });
        }

        if (!await isAdmin(req.user._id, householdId)) {
            return res.status(403).json({
                message: "Admin access required"
            });
        }

        const template = await RecurringChoreTemplate.create({
            ...body,
            householdId,
            createdBy: req.user._id,
            schedulerMetadata: {
                ...(body.schedulerMetadata || {}),
                nextRunAt:
                    body.schedulerMetadata?.nextRunAt ||
                    body.activePeriod?.startsAt ||
                    new Date(),
                lastProcessedAt: null,
                processingLeaseUntil: null
            }
        });

        return res.status(201).json({
            message: "Recurring chore template created successfully",
            template
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            message: error.message || "Unable to create recurring chore template"
        });
    }
};

const listRecurringChores = async (req, res) => {
    try {
        const { householdId } = req.query;

        if (!householdId) {
            return res.status(400).json({
                message: "householdId is required"
            });
        }

        if (!await isMember(req.user._id, householdId)) {
            return res.status(403).json({
                message: "You are not a member of this household"
            });
        }

        const templates = await RecurringChoreTemplate.find({
            householdId
        }).sort({ createdAt: -1 });

        return res.status(200).json({ templates });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getRecurringChore = async (req, res) => {
    try {
        const template = await RecurringChoreTemplate.findById(req.params.id);

        if (!template) {
            return res.status(404).json({
                message: "Recurring chore template not found"
            });
        }

        if (!await isMember(req.user._id, template.householdId)) {
            return res.status(403).json({
                message: "You are not a member of this household"
            });
        }

        return res.status(200).json({ template });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const updateRecurringChore = async (req, res) => {
    try {
        const template = await RecurringChoreTemplate.findById(req.params.id);

        if (!template) {
            return res.status(404).json({
                message: "Recurring chore template not found"
            });
        }

        if (!await isAdmin(req.user._id, template.householdId)) {
            return res.status(403).json({
                message: "Admin access required"
            });
        }

        const allowed = [
            "title",
            "description",
            "assignment",
            "schedule",
            "metadata",
            "notification",
            "activePeriod"
        ];

        for (const field of allowed) {
            if (req.body[field] !== undefined) {
                template[field] = req.body[field];
            }
        }

        if (req.body.activePeriod?.startsAt !== undefined) {
            template.schedulerMetadata.nextRunAt =
                req.body.activePeriod.startsAt;
        }

        await template.save();

        return res.status(200).json({
            message: "Recurring chore template updated successfully",
            template
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            message: error.message || "Unable to update recurring chore template"
        });
    }
};

const deleteRecurringChore = async (req, res) => {
    try {
        const template = await RecurringChoreTemplate.findById(req.params.id);

        if (!template) {
            return res.status(404).json({
                message: "Recurring chore template not found"
            });
        }

        if (!await isAdmin(req.user._id, template.householdId)) {
            return res.status(403).json({
                message: "Admin access required"
            });
        }

        await template.deleteOne();

        return res.status(200).json({
            message: "Recurring chore template deleted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const generateRecurringChoreManually = async (req, res) => {
    try {
        const template = await RecurringChoreTemplate.findById(req.params.id);

        if (!template) {
            return res.status(404).json({
                message: "Recurring chore template not found"
            });
        }

        if (!await isAdmin(req.user._id, template.householdId)) {
            return res.status(403).json({
                message: "Admin access required"
            });
        }

        if (!req.body.occurrenceDate) {
            return res.status(400).json({
                message: "occurrenceDate is required"
            });
        }

        const result = await generateOccurrence(
            template.toObject(),
            req.body.occurrenceDate,
            { generationType: "manual" }
        );

        if (!result.created && !result.idempotent) {
            return res.status(409).json({
                message: "Recurring chore could not be generated",
                reason: result.reason
            });
        }

        return res.status(result.idempotent ? 200 : 201).json({
            message: result.idempotent
                ? "Recurring chore already exists"
                : "Recurring chore generated successfully",
            chore: result.chore
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export {
    createRecurringChore,
    listRecurringChores,
    getRecurringChore,
    updateRecurringChore,
    deleteRecurringChore,
    generateRecurringChoreManually
};
