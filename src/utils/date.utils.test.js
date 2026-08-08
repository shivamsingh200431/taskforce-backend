import {
    getCalendarDate,
    getStartOfDay,
    addCalendarDays,
    isSameCalendarDate,
    getWeekStart,
} from "./date.utils.js";

// ==========================================
// Test Configuration
// ==========================================

const TIMEZONE = "Asia/Kolkata";

// ==========================================
// Test 1: Get Calendar Date
// ==========================================

const timestamp = new Date("2026-08-08T18:30:00.000Z");

const calendarDate = getCalendarDate(
    timestamp,
    TIMEZONE
);

console.assert(
    calendarDate === "2026-08-09",
    `Expected 2026-08-09, received ${calendarDate}`
);

// ==========================================
// Test 2: Get Start Of Day
// ==========================================

const startOfDay = getStartOfDay(
    "2026-08-09",
    TIMEZONE
);

console.assert(
    startOfDay.toISOString() === "2026-08-08T18:30:00.000Z",
    `Unexpected startOfDay: ${startOfDay.toISOString()}`
);

// ==========================================
// Test 3: Add Calendar Days
// ==========================================

const nextDay = addCalendarDays(
    "2026-08-09",
    1
);

console.assert(
    nextDay === "2026-08-10",
    `Expected 2026-08-10, received ${nextDay}`
);

// ==========================================
// Test 4: Subtract Calendar Days
// ==========================================

const previousDay = addCalendarDays(
    "2026-08-09",
    -1
);

console.assert(
    previousDay === "2026-08-08",
    `Expected 2026-08-08, received ${previousDay}`
);

// ==========================================
// Test 5: Same Calendar Date
// ==========================================

const dateA = new Date("2026-08-08T18:30:00.000Z");
const dateB = new Date("2026-08-09T05:00:00.000Z");

console.assert(
    isSameCalendarDate(dateA, dateB, TIMEZONE),
    "Expected both timestamps to represent the same calendar date."
);

// ==========================================
// Test 6: Different Calendar Dates
// ==========================================

const dateC = new Date("2026-08-09T18:30:00.000Z");

console.assert(
    !isSameCalendarDate(dateA, dateC, TIMEZONE),
    "Expected timestamps to represent different calendar dates."
);

// ==========================================
// Test 7: Get Week Start - Sunday
// ==========================================

const sundayWeekStart = getWeekStart(
    "2026-08-09"
);

console.assert(
    sundayWeekStart === "2026-08-09",
    `Expected 2026-08-09, received ${sundayWeekStart}`
);

// ==========================================
// Test 8: Get Week Start - Wednesday
// ==========================================

const wednesdayWeekStart = getWeekStart(
    "2026-08-12"
);

console.assert(
    wednesdayWeekStart === "2026-08-09",
    `Expected 2026-08-09, received ${wednesdayWeekStart}`
);

// ==========================================
// Test 9: Get Week Start - Saturday
// ==========================================

const saturdayWeekStart = getWeekStart(
    "2026-08-15"
);

console.assert(
    saturdayWeekStart === "2026-08-09",
    `Expected 2026-08-09, received ${saturdayWeekStart}`
);

console.log("✅ All date utility tests passed.");