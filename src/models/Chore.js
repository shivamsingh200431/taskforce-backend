import mongoose from "mongoose";

const RECURRING_GENERATION_TYPES = [
    "normal",
    "recovery",
    "manual"
];

const choreReviewHistorySchema = new mongoose.Schema(
    {
        action: {
            type: String,
            enum: [
                "submitted",
                "approved",
                "needs-improvement",
                "rejected",
                "resubmitted"
            ],
            required: true
        },
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        feedback: {
            type: String,
            default: ""
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        _id: false
    }
);

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
            enum: ["pending", "approved", "needs-improvement", "rejected"],
            default: "approved"
        },

        reviewHistory: {
            type: [choreReviewHistorySchema],
            default: []
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

choreSchema.index({
    householdId: 1,
    assignedTo: 1,
    approvalStatus: 1,
    completionStatus: 1
});

choreSchema.index({
    householdId: 1,
    assignedTo: 1,
    approvalStatus: 1,
    createdAt: -1
});

export default mongoose.model("Chore", choreSchema);
