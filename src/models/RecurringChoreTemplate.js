import mongoose from "mongoose";

import {
    ASSIGNMENT_STRATEGY,
    CHORE_CATEGORY,
    FREQUENCY,
    MONTHLY_RULE,
} from "../constants/chore.constants.js";

// ==========================================
// Schedule Schema
// ==========================================

const scheduleSchema = new mongoose.Schema(
    {
        frequency: {
            type: String,
            enum: Object.values(FREQUENCY),
            required: true,
            default: FREQUENCY.WEEKLY,
        },
        interval: {
            type: Number,
            min: 1,
            default: 1,
        },
        weekdays: {
            type: [
                {
                    type: Number,
                    min: 0,
                    max: 6,
                },
            ],
            default: [],
        },    
        dayOfMonth: {
            type: Number,
            min: 1,
            max: 31,
            default: null,
        },
        month: {
            type: Number,
            min: 1,
            max: 12,
            default: null,
        },
        monthlyRule: {
            type: String,
            enum: Object.values(MONTHLY_RULE),
            default: null,
        },
    },
    {
        _id: false,
    }
);

// ==========================================
// Schedule Validation Helpers
// ==========================================

const invalidateField = (
    schedule, 
    field, 
    message
) => {
    schedule.invalidate(field, message);
};

const validateDaily = (schedule) => {
    if (schedule.weekdays.length > 0) {
        invalidateField(
            schedule,
            "weekdays",
            "Weekdays are not allowed for daily schedules."
        );
    }

    if (schedule.dayOfMonth !== null) {
        invalidateField(
            schedule,
            "dayOfMonth",
            "Day of month is not allowed for daily schedules."
        );
    }

    if (schedule.month !== null) {
        invalidateField(
            schedule,
            "month",
            "Month is only allowed for yearly schedules."
        );
    }

    if (schedule.monthlyRule !== null) {
        invalidateField(
            schedule,
            "monthlyRule",
            "Monthly rule is only allowed for monthly schedules."
        );
    }
};

const validateWeekly = (schedule) => {
    if (schedule.weekdays.length === 0) {
        invalidateField(
            schedule,
            "weekdays",
            "Weekdays are required for weekly schedules."
        );
    }

    if (schedule.dayOfMonth !== null) {
        invalidateField(
            schedule,
            "dayOfMonth",
            "Day of month is not allowed for weekly schedules."
        );
    }

    if (schedule.month !== null) {
        invalidateField(
            schedule,
            "month",
            "Month is only allowed for yearly schedules."
        );
    }

    if (schedule.monthlyRule !== null) {
        invalidateField(
            schedule,
            "monthlyRule",
            "Monthly rule is only allowed for monthly schedules."
        );
    }
};

const validateMonthly = (schedule) => {
    if (schedule.month !== null) {
        invalidateField(
            schedule,
            "month",
            "Month is only allowed for yearly schedules."
        );
    }

    if (schedule.weekdays.length > 0) {
        invalidateField(
            schedule,
            "weekdays",
            "Weekdays are not allowed for monthly schedules."
        ); 
    }            

    if (!schedule.monthlyRule) {
        invalidateField(
            schedule,
            "monthlyRule",
            "Monthly rule is required for monthly schedules."
        );
    } else {
        switch (schedule.monthlyRule) {
            case MONTHLY_RULE.FIXED_DAY:
                if (schedule.dayOfMonth === null) {
                    invalidateField(
                        schedule,
                        "dayOfMonth",
                        "Day of month is required when using the FIXED_DAY rule."
                    );
                }
                break;
  
            
           case MONTHLY_RULE.LAST_DAY:
                if (schedule.dayOfMonth !== null) {
                invalidateField(
                    schedule,
                    "dayOfMonth",
                    "Day of month must not be provided when using the LAST_DAY rule."
                );
            }
            break;

        }
    }
};

const validateYearly = (schedule) => {
    if (schedule.month === null) {
        invalidateField(
            schedule,
            "month",
            "Month is required for yearly schedules."
        );
    }

    if (schedule.dayOfMonth === null) {
        invalidateField(
            schedule,
            "dayOfMonth",
            "Day of month is required for yearly schedules."
        );
    }

    if (schedule.weekdays.length > 0) {
        invalidateField(
            schedule,
            "weekdays",
            "Weekdays are not allowed for yearly schedules."
        );
    }

    if (schedule.monthlyRule !== null) {
        invalidateField(
            schedule,
            "monthlyRule",
            "Monthly rule is only allowed for monthly schedules."
        );
    }
};

// ==========================================
// Schedule Validation Middleware
// ==========================================

scheduleSchema.pre("validate", function (next) {
    switch (this.frequency) {
        case FREQUENCY.DAILY:
            validateDaily(this);
            break;

        case FREQUENCY.WEEKLY:
            validateWeekly(this);
            break;

        case FREQUENCY.MONTHLY:
            validateMonthly(this);
            break;

        case FREQUENCY.YEARLY:
            validateYearly(this);
            break;

        default:
            break;
    }

    next();
});

// ==========================================
// Assignment Schema
// ==========================================

const assignmentSchema = new mongoose.Schema(
    {
        strategy: {
            type: String,
            enum: Object.values(ASSIGNMENT_STRATEGY),
            required: true,
            default: ASSIGNMENT_STRATEGY.ROTATION,
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: function () {
                return (
                    this.strategy === ASSIGNMENT_STRATEGY.FIXED
                );
            },

            validate: {
            validator(value) {
                if (this.strategy === ASSIGNMENT_STRATEGY.ROTATION) {
                    return value == null;
                }

                return true;
            },
            message: "assignedTo must be null when using rotation."
        },
        },
        
    },
    {
        _id: false,
    }
);


// ==========================================
// Metadata Schema
// ==========================================

const metadataSchema = new mongoose.Schema(
    {},
    {
        _id: false,
    }
);


// ==========================================
// Notification Schema
// ==========================================


const notificationSchema = new mongoose.Schema(
    {},
    {
        _id: false,
    }
);


// ==========================================
// Recurring Chore Template Schema
// ==========================================

const recurringChoreTemplateSchema = new mongoose.Schema(
    {
        // ==========================================
        // Basic Information
        // ==========================================

        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 100,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },

        householdId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Household",
            required: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        assignment: {
            type: assignmentSchema,
            default: () => ({}),
        },
        schedule: {
            type: scheduleSchema,
            default: () => ({}),
        },
        metadata: {
            type: metadataSchema,
            default: () => ({}),
        },
        notification: {
            type: notificationSchema,
            default: () => ({}),
        },
    },
    {
        timestamps: true,
    }
);



const RecurringChoreTemplate = mongoose.model(
    "RecurringChoreTemplate",
    recurringChoreTemplateSchema
);

export default RecurringChoreTemplate;