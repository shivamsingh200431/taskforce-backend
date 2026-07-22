// ==========================================
// Assignment
// ==========================================

export const ASSIGNMENT_STRATEGY = Object.freeze({
    FIXED: "fixed",
    ROTATION: "rotation",
});

export const ASSIGNED_BY = Object.freeze({
    ADMIN: "admin",
    SYSTEM: "system",
});

// ==========================================
// Completion
// ==========================================

export const COMPLETION_STATUS = Object.freeze({
    PENDING: "pending",
    COMPLETED: "completed",
    PENDING_REVIEW: "pendingReview",
    NEEDS_IMPROVEMENT: "needsImprovement",
    REJECTED: "rejected",
    SKIPPED: "skipped",
    OVERDUE: "overdue",
});

// ==========================================
// Generation
// ==========================================

export const GENERATION_TYPE = Object.freeze({
    NORMAL: "normal",
    RECOVERY: "recovery",
    MANUAL: "manual",
});

// ==========================================
// Chore Categories
// ==========================================

export const CHORE_CATEGORY = Object.freeze({
    CLEANING: "cleaning",
    COOKING: "cooking",
    LAUNDRY: "laundry",
    SHOPPING: "shopping",
    MAINTENANCE: "maintenance",
    OUTDOOR: "outdoor",
    PETS: "pets",
    OTHER: "other",
});

// ==========================================
// Schedule
// ==========================================

export const FREQUENCY = Object.freeze({
    DAILY: "daily",
    WEEKLY: "weekly",
    MONTHLY: "monthly",
    YEARLY: "yearly",
});

export const MONTHLY_RULE = Object.freeze({
    FIXED_DAY: "fixedDay",
    LAST_DAY: "lastDay",
});

// ==========================================
// History Actions
// ==========================================

export const HISTORY_ACTIONS = Object.freeze({
    GENERATED: "generated",

    CREATED: "created",

    ASSIGNED: "assigned",
    REASSIGNED: "reassigned",
    AUTO_REASSIGNED: "autoReassigned",

    COMPLETED: "completed",
    APPROVED: "approved",
    REJECTED: "rejected",
    NEEDS_IMPROVEMENT: "needsImprovement",
    SKIPPED: "skipped",
    OVERDUE: "overdue",

    COMMENT_ADDED: "commentAdded",
    COMMENT_EDITED: "commentEdited",
    COMMENT_DELETED: "commentDeleted",

    ATTACHMENT_ADDED: "attachmentAdded",
    ATTACHMENT_DELETED: "attachmentDeleted",
});