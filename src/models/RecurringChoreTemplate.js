import mongoose from "mongoose";

import {
    ASSIGNMENT_STRATEGY,
    CHORE_CATEGORY,
    FREQUENCY,
    MONTHLY_RULE,
} from "../constants/chore.constants.js";

import { 
    CHORE_DIFFICULTY,
    //DIFFICULTY_POINTS,
} from "../constants/metadata.constants.js";

import {
    REMINDER_UNIT,
} from "../constants/notification.constants.js";

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
    {
        category: {
            type: String,
            enum: Object.values(CHORE_CATEGORY),
            required: true,
        },
        difficulty: {
            type: Number,
            enum: Object.values(CHORE_DIFFICULTY),
            required: true,
            default: CHORE_DIFFICULTY.MEDIUM,
        },
        estimatedDuration: {
            type: Number,
            min: 1,
            required: true,
        },
        tags: {
            type: [
                {
                    type: String,
                    trim: true,
                    lowercase: true,
                },
            ],
            default: [],
        },
    },
    {
        _id: false,
    }
);


// ==========================================
// Reminder Offset Schema
// ==========================================

const reminderOffsetSchema = new mongoose.Schema(
    {
        value: {
            type: Number,
            min: 1,
            default: null,
        },

        unit: {
            type: String,
            enum: Object.values(REMINDER_UNIT),
            default: null,
        },
    },
    {
        _id: false,
    }
);


// ==========================================
// Notification Schema
// ==========================================

const notificationSchema = new mongoose.Schema(
    {
        enabled: {
            type: Boolean,
            default: true,
        },

        reminderOffset: {
            type: reminderOffsetSchema,
            default: () => ({}),
        },
    },
    {
        _id: false,
    }
);


// ==========================================
// Notification Validation Helpers
// ==========================================

const validateNotification = (notification) => {

    if (notification.enabled) {

        if (notification.reminderOffset.value == null) {
            invalidateField(
                notification,
                "reminderOffset.value",
                "Reminder value is required when notifications are enabled."
            );
        }

        if (notification.reminderOffset.unit == null) {
            invalidateField(
                notification,
                "reminderOffset.unit",
                "Reminder unit is required when notifications are enabled."
            );
        }

    } else {

        if (notification.reminderOffset.value != null) {
            invalidateField(
                notification,
                "reminderOffset.value",
                "Reminder value must not be provided when notifications are disabled."
            );
        }

        if (notification.reminderOffset.unit != null) {
            invalidateField(
                notification,
                "reminderOffset.unit",
                "Reminder unit must not be provided when notifications are disabled."
            );
        }

    }

};


// ==========================================
// Notification Validation Middleware
// ==========================================

notificationSchema.pre("validate", function (next) {

    validateNotification(this);

    next();

});

// ==========================================
// Active Period Schema
// ==========================================

const activePeriodSchema = new mongoose.Schema(
    {
        startsAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        endsAt: {
            type: Date,
            default: null,
        },
    },
    {
        _id: false,
    }
);

// ==========================================
// Active Period Validation Helpers
// ==========================================

const validateActivePeriod = (activePeriod) => {
    if (activePeriod.endsAt !== null && 
        activePeriod.endsAt < activePeriod.startsAt
    ) {
        invalidateField(activePeriod, "endsAt", 
            "End date cannot be before start date."
        );
    }
};

// ==========================================
// Active Period Validation Middleware
// ==========================================

activePeriodSchema.pre("validate", function (next) {
    validateActivePeriod(this);
    next();
});

// ==========================================
// Scheduler Metadata Schema
// ==========================================

const schedulerMetadataSchema = new mongoose.Schema(
    {
        nextRunAt: {
            type: Date,
            required: true,
        },
        lastProcessedAt: {
            type: Date,
            default: null,
        },
    },
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
        activePeriod: {
            type: activePeriodSchema,
            default: () => ({}),
        },
        schedulerMetadata: {
            type: schedulerMetadataSchema,
            default: () => ({}),
        },
    },
    {
        timestamps: true,
    }
);

// ==========================================
// Indexes
// ==========================================

// Scheduler queries
recurringChoreTemplateSchema.index({
            "schedulerMetadata.nextRunAt": 1,
        });

// Templates created by a user
recurringChoreTemplateSchema.index({
            createdBy: 1,
        });

// Active templates within a household
recurringChoreTemplateSchema.index({
            householdId: 1,
            "activePeriod.endsAt": 1,
        });

// Prevent duplicate recurring chore titles within a household
recurringChoreTemplateSchema.index(
        {
            householdId: 1,
            title: 1,
        },
        {
            unique: true,
        }
);



const RecurringChoreTemplate = mongoose.model(
    "RecurringChoreTemplate",
    recurringChoreTemplateSchema
);

export default RecurringChoreTemplate;