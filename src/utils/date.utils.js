import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { addDays } from "date-fns";

// ==========================================
// Calendar Date
// ==========================================

export const getCalendarDate = (
    date,
    timezone
) => {
    return formatInTimeZone(
        date,
        timezone,
        "yyyy-MM-dd"
    );
};

// ==========================================
// Start Of Day
// ==========================================

export const getStartOfDay = (
    calendarDate,
    timezone
) => {
    return fromZonedTime(
        `${calendarDate} 00:00:00`,
        timezone
    );
};

// ==========================================
// Add Calendar Days
// ==========================================

export const addCalendarDays = (
    calendarDate,
    days
) => {
    const date = new Date(`${calendarDate}T00:00:00Z`);

    const result = addDays(date, days);

    return result.toISOString().slice(0, 10);
};

// ==========================================
// Compare Calendar Dates
// ==========================================

export const isSameCalendarDate = (
    dateA,
    dateB,
    timezone
) => {
    return (
        getCalendarDate(dateA, timezone) ===
        getCalendarDate(dateB, timezone)
    );
};

// ==========================================
// Get Week Start
// ==========================================

export const getWeekStart = (calendarDate) => {
    const date = new Date(
        `${calendarDate}T00:00:00Z`
    );

    const weekday = date.getUTCDay();

    return addCalendarDays(
        calendarDate,
        -weekday
    );
};