const mongoose = require("mongoose");

const RECURRING_GENERATION_TYPES = [
    "normal",
    "recovery",
    "manual"
];

const choreSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 100
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        householdId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Household",
            required: true
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        choreType: {
            type: String,
            enum: ["recurring", "one-time"],
            required: true
        },

        recurringTemplateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RecurringChoreTemplate",
            required: function () {
                return this.choreType === "recurring";
            }
        },

        occurrenceDate: {
            type: Date,
            required: function () {
                return this.choreType === "recurring";
            }
        },

        generationType: {
            type: String,
            enum: RECURRING_GENERATION_TYPES,
            required: function () {
                return this.choreType === "recurring";
            }
        },

        completionStatus: {
            type: String,
            enum: ["pending", "completed", "missed", "overdue"],
            default: "pending"
        },

        suggestedDifficulty: {
            type: Number,
            min: 1,
            max: 5
        },

        approvedDifficulty: {
            type: Number,
            min: 1,
            max: 5
        },

        approvalStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "approved"
        },

        source: {
            type: String,
            enum: [
                "admin-assigned",
                "member-submitted"
            ],
            required: true
        },

        feedback: {
            type: String,
            default: ""
        },

        dueDate: {
            type: Date
        }
    },

    {
        timestamps: true
    }
);

choreSchema.index(
    {
        recurringTemplateId: 1,
        occurrenceDate: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            choreType: "recurring"
        }
    }
);

module.exports = mongoose.model("Chore", choreSchema);