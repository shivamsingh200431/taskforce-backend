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

// ==========================================
// Get Month Start
// ==========================================

export const getMonthStart = (calendarDate) => {
    const date = new Date(
        `${calendarDate}T00:00:00Z`
    );

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();

    return [
        year,
        String(month + 1).padStart(2, "0"),
        "01",
    ].join("-");
};

// ==========================================
// Get Last Day Of Month
// ==========================================

export const getLastDayOfMonth = (calendarDate) => {
    const date = new Date(
        `${calendarDate}T00:00:00Z`
    );

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();

    const lastDay = new Date(
        Date.UTC(
            year,
            month + 1,
            0
        )
    );

    return [
        lastDay.getUTCFullYear(),
        String(
            lastDay.getUTCMonth() + 1
        ).padStart(2, "0"),
        String(
            lastDay.getUTCDate()
        ).padStart(2, "0"),
    ].join("-");
};

// ==========================================
// Get Year Start
// ==========================================

export const getYearStart = (calendarDate) => {
    const date = new Date(
        `${calendarDate}T00:00:00Z`
    );

    return `${date.getUTCFullYear()}-01-01`;
};

// ==========================================
// Add Calendar Years
// ==========================================

export const addCalendarYears = (
    calendarDate,
    years
) => {
    const date = new Date(
        `${calendarDate}T00:00:00Z`
    );

    date.setUTCFullYear(
        date.getUTCFullYear() + years
    );

    return [
        date.getUTCFullYear(),
        String(
            date.getUTCMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getUTCDate()
        ).padStart(2, "0"),
    ].join("-");
};