import {
    addCalendarDays,
    getWeekStart,
} from "./date.utils.js";

import {
    WEEKDAY,
} from "../constants/chore.constants.js";

// ==========================================
// Validation Helpers
// ==========================================

const validateDateRange = (
    startDate,
    endDate
) => {
    if (!startDate || !endDate) {
        throw new Error(
            "Start date and end date are required."
        );
    }

    if (startDate > endDate) {
        throw new Error(
            "Start date cannot be after end date."
        );
    }
};

const validateInterval = (interval) => {
    if (
        !Number.isInteger(interval) ||
        interval < 1
    ) {
        throw new Error(
            "Interval must be a positive integer."
        );
    }
};

// ==========================================
// Daily Recurrence
// ==========================================

export const getDailyOccurrences = ({
    startDate,
    endDate,
    interval = 1,
}) => {
    validateDateRange(
        startDate,
        endDate
    );

    validateInterval(interval);

    const occurrences = [];

    let currentDate = startDate;

    while (currentDate <= endDate) {
        occurrences.push(currentDate);

        currentDate = addCalendarDays(
            currentDate,
            interval
        );
    }

    return occurrences;
};

// ==========================================
// Weekly Validation Helpers
// ==========================================

const validateWeekdays = (weekdays) => {
    if (!Array.isArray(weekdays) || weekdays.length === 0) {
        throw new Error(
            "At least one weekday is required for weekly recurrence."
        );
    }

    const uniqueWeekdays = new Set(weekdays);

    if (uniqueWeekdays.size !== weekdays.length) {
        throw new Error(
            "Weekdays must not contain duplicate values."
        );
    }

    for (const weekday of weekdays) {
        if (
            !Number.isInteger(weekday) ||
            weekday < WEEKDAY.SUNDAY ||
            weekday > WEEKDAY.SATURDAY
        ) {
            throw new Error(
                "Weekdays must contain integers from 0 to 6."
            );
        }
    }
};

// ==========================================
// Weekly Recurrence
// ==========================================

export const getWeeklyOccurrences = ({
    startDate,
    endDate,
    interval = 1,
    weekdays,
}) => {
    validateDateRange(
        startDate,
        endDate
    );

    validateInterval(interval);
    validateWeekdays(weekdays);

    const occurrences = [];

    const firstWeekStart = getWeekStart(
        startDate
    );

    let currentWeekStart = firstWeekStart;
    let weekIndex = 0;

    while (currentWeekStart <= endDate) {
        if (weekIndex % interval === 0) {
            for (const weekday of weekdays) {
                const occurrenceDate = addCalendarDays(
                    currentWeekStart,
                    weekday
                );

                if (
                    occurrenceDate >= startDate &&
                    occurrenceDate <= endDate
                ) {
                    occurrences.push(
                        occurrenceDate
                    );
                }
            }
        }

        currentWeekStart = addCalendarDays(
            currentWeekStart,
            7
        );

        weekIndex++;
    }

    return occurrences.sort();
};