const mongoose = require("mongoose");

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

        status: {
            type: String,
            enum: ["pending", "completed", "missed"],
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

module.exports = mongoose.model("Chore", choreSchema);