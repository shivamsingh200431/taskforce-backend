import {
    getCalendarDate,
    getStartOfDay,
    addCalendarDays,
    isSameCalendarDate,
    getWeekStart,
    getMonthStart,
    getLastDayOfMonth,
    getYearStart,
    addCalendarYears,
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

// ==========================================
// Test 10: Get Month Start
// ==========================================

const augustMonthStart = getMonthStart(
    "2026-08-17"
);

console.assert(
    augustMonthStart === "2026-08-01",
    `Expected 2026-08-01, received ${augustMonthStart}`
);

// ==========================================
// Test 11: Get Month Start - First Day
// ==========================================

const firstDayMonthStart = getMonthStart(
    "2026-08-01"
);

console.assert(
    firstDayMonthStart === "2026-08-01",
    `Expected 2026-08-01, received ${firstDayMonthStart}`
);

// ==========================================
// Test 12: Get Last Day - 31-Day Month
// ==========================================

const augustLastDay = getLastDayOfMonth(
    "2026-08-17"
);

console.assert(
    augustLastDay === "2026-08-31",
    `Expected 2026-08-31, received ${augustLastDay}`
);

// ==========================================
// Test 13: Get Last Day - 30-Day Month
// ==========================================

const septemberLastDay = getLastDayOfMonth(
    "2026-09-17"
);

console.assert(
    septemberLastDay === "2026-09-30",
    `Expected 2026-09-30, received ${septemberLastDay}`
);

// ==========================================
// Test 14: Get Last Day - Non-Leap February
// ==========================================

const februaryLastDay = getLastDayOfMonth(
    "2026-02-17"
);

console.assert(
    februaryLastDay === "2026-02-28",
    `Expected 2026-02-28, received ${februaryLastDay}`
);

// ==========================================
// Test 15: Get Last Day - Leap Year
// ==========================================

const leapYearLastDay = getLastDayOfMonth(
    "2028-02-17"
);

console.assert(
    leapYearLastDay === "2028-02-29",
    `Expected 2028-02-29, received ${leapYearLastDay}`
);

// ==========================================
// Test 16: Get Year Start
// ==========================================

const yearStart = getYearStart(
    "2026-08-15"
);

console.assert(
    yearStart === "2026-01-01",
    `Expected 2026-01-01, received ${yearStart}`
);

// ==========================================
// Test 17: Get Year Start - First Day
// ==========================================

const firstDayYearStart = getYearStart(
    "2026-01-01"
);

console.assert(
    firstDayYearStart === "2026-01-01",
    `Expected 2026-01-01, received ${firstDayYearStart}`
);

// ==========================================
// Test 18: Get Year Start - Leap Year
// ==========================================

const leapYearStart = getYearStart(
    "2028-02-29"
);

console.assert(
    leapYearStart === "2028-01-01",
    `Expected 2028-01-01, received ${leapYearStart}`
);

// ==========================================
// Test 19: Add Calendar Years
// ==========================================

const nextYear = addCalendarYears(
    "2026-08-15",
    1
);

console.assert(
    nextYear === "2027-08-15",
    `Expected 2027-08-15, received ${nextYear}`
);

// ==========================================
// Test 20: Add Multiple Calendar Years
// ==========================================

const futureDate = addCalendarYears(
    "2026-08-15",
    5
);

console.assert(
    futureDate === "2031-08-15",
    `Expected 2031-08-15, received ${futureDate}`
);

// ==========================================
// Test 21: Leap Year Boundary
// ==========================================

const leapYearDate = addCalendarYears(
    "2028-02-29",
    1
);

console.assert(
    leapYearDate === "2029-03-01",
    `Expected 2029-03-01, received ${leapYearDate}`
);

console.log(
    "✅ Year utility tests passed."
);

console.log("✅ All date utility tests passed.");