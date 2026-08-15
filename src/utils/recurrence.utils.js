import {
    addCalendarDays,
    addCalendarYears,
    getWeekStart,
    getMonthStart,
    getLastDayOfMonth,
    getYearStart,
} from "./date.utils.js";

import {
    MONTHLY_RULE,
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


// ==========================================
// Monthly Validation Helpers
// ==========================================

const validateMonthlyRule = (monthlyRule) => {
    const validRules = Object.values(MONTHLY_RULE);

    if (!validRules.includes(monthlyRule)) {
        throw new Error(
            "A valid monthly rule is required."
        );
    }
};

const validateDayOfMonth = (dayOfMonth) => {
    if (
        !Number.isInteger(dayOfMonth) ||
        dayOfMonth < 1 ||
        dayOfMonth > 31
    ) {
        throw new Error(
            "Day of month must be an integer between 1 and 31."
        );
    }
};

const validateMonthlyArguments = (
    monthlyRule,
    dayOfMonth
) => {
    validateMonthlyRule(monthlyRule);

    if (monthlyRule === MONTHLY_RULE.FIXED_DAY) {
        validateDayOfMonth(dayOfMonth);
        return;
    }

    if (
        monthlyRule === MONTHLY_RULE.LAST_DAY &&
        dayOfMonth !== undefined &&
        dayOfMonth !== null
    ) {
        throw new Error(
            "Day of month must not be provided when using the LAST_DAY rule."
        );
    }
};

// ==========================================
// Monthly Recurrence
// ==========================================

export const getMonthlyOccurrences = ({
    startDate,
    endDate,
    interval = 1,
    monthlyRule,
    dayOfMonth,
}) => {
    validateDateRange(
        startDate,
        endDate
    );

    validateInterval(interval);

    validateMonthlyArguments(
        monthlyRule,
        dayOfMonth
    );

    const occurrences = [];

    let currentMonthStart = getMonthStart(
        startDate
    );

    let monthIndex = 0;

    while (currentMonthStart <= endDate) {
        if (monthIndex % interval === 0) {
            let occurrenceDate = null;

            if (
                monthlyRule ===
                MONTHLY_RULE.FIXED_DAY
            ) {
                const lastDayOfMonth =
                    getLastDayOfMonth(
                        currentMonthStart
                    );

                const lastDayNumber = Number(
                    lastDayOfMonth.slice(8, 10)
                );

                if (dayOfMonth <= lastDayNumber) {
                    occurrenceDate =
                        `${currentMonthStart.slice(0, 8)}${String(
                            dayOfMonth
                        ).padStart(2, "0")}`;
                }
            }

            if (
                monthlyRule ===
                MONTHLY_RULE.LAST_DAY
            ) {
                occurrenceDate =
                    getLastDayOfMonth(
                        currentMonthStart
                    );
            }

            if (
                occurrenceDate &&
                occurrenceDate >= startDate &&
                occurrenceDate <= endDate
            ) {
                occurrences.push(
                    occurrenceDate
                );
            }
        }

        currentMonthStart = addCalendarDays(
            getLastDayOfMonth(
                currentMonthStart
            ),
            1
        );

        monthIndex++;
    }

    return occurrences;
};


// ==========================================
// Yearly Validation Helpers
// ==========================================

const validateMonth = (month) => {
    if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
    ) {
        throw new Error(
            "Month must be an integer between 1 and 12."
        );
    }
};

// ==========================================
// Yearly Recurrence
// ==========================================

export const getYearlyOccurrences = ({
    startDate,
    endDate,
    interval = 1,
    month,
    dayOfMonth,
}) => {
    validateDateRange(
        startDate,
        endDate
    );

    validateInterval(interval);
    validateMonth(month);
    validateDayOfMonth(dayOfMonth);

    const occurrences = [];

    let currentYearStart = getYearStart(
        startDate
    );

    let yearIndex = 0;

    while (currentYearStart <= endDate) {
        if (yearIndex % interval === 0) {
            const year =
                currentYearStart.slice(0, 4);

            const monthStart =
                `${year}-${String(month).padStart(2, "0")}-01`;

            const lastDayOfMonth =
                getLastDayOfMonth(
                    monthStart
                );

            const lastDayNumber = Number(
                lastDayOfMonth.slice(8, 10)
            );

            // The requested date does not exist
            // in this particular year/month.
            if (dayOfMonth <= lastDayNumber) {
                const occurrenceDate =
                    `${year}-${String(month).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`;

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

        currentYearStart = addCalendarYears(
            currentYearStart,
            1
        );

        yearIndex++;
    }

    return occurrences;
};