const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        householdId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Household",
            required: true
        },

        role: {
            type: String,
            enum: ["admin", "member"],
            default: "member"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Membership", membershipSchema);