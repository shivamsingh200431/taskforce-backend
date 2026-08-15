import {
    getDailyOccurrences,
    getWeeklyOccurrences,
    getMonthlyOccurrences,
    getYearlyOccurrences,
} from "./recurrence.utils.js";

import {
    WEEKDAY,
    MONTHLY_RULE,
} from "../constants/chore.constants.js";

// ==========================================
// Test 1: Daily Interval = 1
// ==========================================

const dailyOccurrences = getDailyOccurrences({
    startDate: "2026-08-09",
    endDate: "2026-08-12",
    interval: 1,
});

console.assert(
    JSON.stringify(dailyOccurrences) ===
        JSON.stringify([
            "2026-08-09",
            "2026-08-10",
            "2026-08-11",
            "2026-08-12",
        ]),
    "Daily interval test failed."
);

// ==========================================
// Test 2: Interval = 2
// ==========================================

const everyTwoDays = getDailyOccurrences({
    startDate: "2026-08-09",
    endDate: "2026-08-15",
    interval: 2,
});

console.assert(
    JSON.stringify(everyTwoDays) ===
        JSON.stringify([
            "2026-08-09",
            "2026-08-11",
            "2026-08-13",
            "2026-08-15",
        ]),
    "Two-day interval test failed."
);

// ==========================================
// Test 3: Single-Day Range
// ==========================================

const singleDay = getDailyOccurrences({
    startDate: "2026-08-09",
    endDate: "2026-08-09",
});

console.assert(
    JSON.stringify(singleDay) ===
        JSON.stringify([
            "2026-08-09",
        ]),
    "Single-day test failed."
);

// ==========================================
// Test 4: Invalid Interval
// ==========================================

try {
    getDailyOccurrences({
        startDate: "2026-08-09",
        endDate: "2026-08-15",
        interval: 0,
    });

    console.assert(
        false,
        "Expected invalid interval error."
    );
} catch (error) {
    console.log(
        "✅ Invalid interval rejected."
    );
}

// ==========================================
// Test 5: Reversed Date Range
// ==========================================

try {
    getDailyOccurrences({
        startDate: "2026-08-15",
        endDate: "2026-08-09",
    });

    console.assert(
        false,
        "Expected reversed date range error."
    );
} catch (error) {
    console.log(
        "✅ Reversed date range rejected."
    );
}

// ==========================================
// Test Complete
// ==========================================

console.log(
    "✅ Daily recurrence tests passed."
);

const mondayOccurrences = getWeeklyOccurrences({
    startDate: "2026-08-09",
    endDate: "2026-08-23",
    interval: 1,
    weekdays: [WEEKDAY.MONDAY],
});

console.assert(
    JSON.stringify(mondayOccurrences) ===
        JSON.stringify([
            "2026-08-10",
            "2026-08-17",
        ]),
    "Single weekday test failed."
);

const multipleWeekdays = getWeeklyOccurrences({
    startDate: "2026-08-09",
    endDate: "2026-08-23",
    interval: 1,
    weekdays: [
        WEEKDAY.MONDAY,
        WEEKDAY.WEDNESDAY,
        WEEKDAY.FRIDAY,
    ],
});

console.assert(
    JSON.stringify(multipleWeekdays) ===
        JSON.stringify([
            "2026-08-10",
            "2026-08-12",
            "2026-08-14",
            "2026-08-17",
            "2026-08-19",
            "2026-08-21",
        ]),
    "Multiple weekdays test failed."
);


const everyTwoWeeks = getWeeklyOccurrences({
    startDate: "2026-08-09",
    endDate: "2026-08-30",
    interval: 2,
    weekdays: [WEEKDAY.MONDAY],
});

console.assert(
    JSON.stringify(everyTwoWeeks) ===
        JSON.stringify([
            "2026-08-10",
            "2026-08-24",
        ]),
    "Two-week interval test failed."
);

const midWeekStart = getWeeklyOccurrences({
    startDate: "2026-08-12",
    endDate: "2026-08-23",
    interval: 1,
    weekdays: [
        WEEKDAY.MONDAY,
        WEEKDAY.WEDNESDAY,
        WEEKDAY.FRIDAY,
    ],
});

console.assert(
    JSON.stringify(midWeekStart) ===
        JSON.stringify([
            "2026-08-12",
            "2026-08-14",
            "2026-08-17",
            "2026-08-19",
            "2026-08-21",
        ]),
    "Mid-week start test failed."
);

try {
    getWeeklyOccurrences({
        startDate: "2026-08-09",
        endDate: "2026-08-23",
        weekdays: [],
    });

    console.assert(
        false,
        "Expected empty weekdays to be rejected."
    );
} catch (error) {
    console.log(
        "✅ Empty weekdays rejected."
    );
}

try {
    getWeeklyOccurrences({
        startDate: "2026-08-09",
        endDate: "2026-08-23",
        weekdays: [
            WEEKDAY.MONDAY,
            WEEKDAY.MONDAY,
        ],
    });

    console.assert(
        false,
        "Expected duplicate weekdays to be rejected."
    );
} catch (error) {
    console.log(
        "✅ Duplicate weekdays rejected."
    );
}

try {
    getWeeklyOccurrences({
        startDate: "2026-08-09",
        endDate: "2026-08-23",
        weekdays: [7],
    });

    console.assert(
        false,
        "Expected invalid weekday to be rejected."
    );
} catch (error) {
    console.log(
        "✅ Invalid weekday rejected."
    );
}

// ==========================================
// Test Complete
// ==========================================

console.log(
    "✅ Weekly recurrence tests passed."
);

// ==========================================
// Test 8: Monthly Fixed Day
// ==========================================

const monthlyFixedDay = getMonthlyOccurrences({
    startDate: "2026-08-01",
    endDate: "2026-12-31",
    interval: 1,
    monthlyRule: MONTHLY_RULE.FIXED_DAY,
    dayOfMonth: 15,
});

console.assert(
    JSON.stringify(monthlyFixedDay) ===
        JSON.stringify([
            "2026-08-15",
            "2026-09-15",
            "2026-10-15",
            "2026-11-15",
            "2026-12-15",
        ]),
    "Monthly fixed-day test failed."
);

// ==========================================
// Test 9: Monthly Last Day
// ==========================================

const monthlyLastDay = getMonthlyOccurrences({
    startDate: "2026-08-01",
    endDate: "2026-12-31",
    interval: 1,
    monthlyRule: MONTHLY_RULE.LAST_DAY,
});

console.assert(
    JSON.stringify(monthlyLastDay) ===
        JSON.stringify([
            "2026-08-31",
            "2026-09-30",
            "2026-10-31",
            "2026-11-30",
            "2026-12-31",
        ]),
    "Monthly last-day test failed."
);

// ==========================================
// Test 10: Monthly Fixed Day 31
// ==========================================

const monthlyDay31 = getMonthlyOccurrences({
    startDate: "2026-08-01",
    endDate: "2026-12-31",
    interval: 1,
    monthlyRule: MONTHLY_RULE.FIXED_DAY,
    dayOfMonth: 31,
});

console.assert(
    JSON.stringify(monthlyDay31) ===
        JSON.stringify([
            "2026-08-31",
            "2026-10-31",
            "2026-12-31",
        ]),
    "Monthly day-31 test failed."
);

// ==========================================
// Test 11: Monthly Interval
// ==========================================

const everyTwoMonths = getMonthlyOccurrences({
    startDate: "2026-08-01",
    endDate: "2027-02-28",
    interval: 2,
    monthlyRule: MONTHLY_RULE.FIXED_DAY,
    dayOfMonth: 15,
});

console.assert(
    JSON.stringify(everyTwoMonths) ===
        JSON.stringify([
            "2026-08-15",
            "2026-10-15",
            "2026-12-15",
            "2027-02-15",
        ]),
    "Monthly interval test failed."
);

// ==========================================
// Test 12: Monthly Leap Year
// ==========================================

const leapYearFebruary = getMonthlyOccurrences({
    startDate: "2028-01-01",
    endDate: "2028-03-31",
    interval: 1,
    monthlyRule: MONTHLY_RULE.FIXED_DAY,
    dayOfMonth: 29,
});

console.assert(
    JSON.stringify(leapYearFebruary) ===
        JSON.stringify([
            "2028-01-29",
            "2028-02-29",
            "2028-03-29",
        ]),
    "Monthly leap-year test failed."
);

// ==========================================
// Test 13: Monthly Partial Range
// ==========================================

const partialRange = getMonthlyOccurrences({
    startDate: "2026-08-20",
    endDate: "2026-11-10",
    interval: 1,
    monthlyRule: MONTHLY_RULE.FIXED_DAY,
    dayOfMonth: 15,
});

console.assert(
    JSON.stringify(partialRange) ===
        JSON.stringify([
            "2026-09-15",
            "2026-10-15",
        ]),
    "Monthly partial-range test failed."
);

// ==========================================
// Test 14: Invalid Day Of Month
// ==========================================

try {
    getMonthlyOccurrences({
        startDate: "2026-08-01",
        endDate: "2026-12-31",
        interval: 1,
        monthlyRule: MONTHLY_RULE.FIXED_DAY,
        dayOfMonth: 32,
    });

    console.assert(
        false,
        "Expected invalid day of month to be rejected."
    );
} catch (error) {
    console.log(
        "✅ Invalid day of month rejected."
    );
}

// ==========================================
// Test 15: Invalid Monthly Rule
// ==========================================

try {
    getMonthlyOccurrences({
        startDate: "2026-08-01",
        endDate: "2026-12-31",
        interval: 1,
        monthlyRule: "INVALID_RULE",
        dayOfMonth: 15,
    });

    console.assert(
        false,
        "Expected invalid monthly rule to be rejected."
    );
} catch (error) {
    console.log(
        "✅ Invalid monthly rule rejected."
    );
}

// ==========================================
// Test 16: Missing Day Of Month
// ==========================================

try {
    getMonthlyOccurrences({
        startDate: "2026-08-01",
        endDate: "2026-12-31",
        interval: 1,
        monthlyRule: MONTHLY_RULE.FIXED_DAY,
    });

    console.assert(
        false,
        "Expected missing day of month to be rejected."
    );
} catch (error) {
    console.log(
        "✅ Missing day of month rejected."
    );
}

try {
    getMonthlyOccurrences({
        startDate: "2026-08-01",
        endDate: "2026-12-31",
        interval: 1,
        monthlyRule: MONTHLY_RULE.LAST_DAY,
        dayOfMonth: 15,
    });

    console.assert(
        false,
        "Expected dayOfMonth with LAST_DAY to be rejected."
    );
} catch (error) {
    console.log(
        "✅ LAST_DAY dayOfMonth rejected."
    );
}


// ==========================================
// Test Complete
// ==========================================

console.log(
    "✅ Monthly recurrence tests passed."
);

// ==========================================
// Test 17: Yearly Fixed Date
// ==========================================

const yearlyFixedDate = getYearlyOccurrences({
    startDate: "2026-01-01",
    endDate: "2030-12-31",
    interval: 1,
    month: 8,
    dayOfMonth: 15,
});

console.assert(
    JSON.stringify(yearlyFixedDate) ===
        JSON.stringify([
            "2026-08-15",
            "2027-08-15",
            "2028-08-15",
            "2029-08-15",
            "2030-08-15",
        ]),
    "Yearly fixed-date test failed."
);

// ==========================================
// Test 18: Yearly Interval
// ==========================================

const everyTwoYears = getYearlyOccurrences({
    startDate: "2026-01-01",
    endDate: "2032-12-31",
    interval: 2,
    month: 8,
    dayOfMonth: 15,
});

console.assert(
    JSON.stringify(everyTwoYears) ===
        JSON.stringify([
            "2026-08-15",
            "2028-08-15",
            "2030-08-15",
            "2032-08-15",
        ]),
    "Yearly interval test failed."
);

// ==========================================
// Test 19: Leap Day
// ==========================================

const leapDayOccurrences = getYearlyOccurrences({
    startDate: "2026-01-01",
    endDate: "2030-12-31",
    interval: 1,
    month: 2,
    dayOfMonth: 29,
});

console.assert(
    JSON.stringify(leapDayOccurrences) ===
        JSON.stringify([
            "2028-02-29",
        ]),
    "Leap-day yearly test failed."
);

// ==========================================
// Test 20: Yearly Partial Range
// ==========================================

const partialYearlyRange = getYearlyOccurrences({
    startDate: "2027-09-01",
    endDate: "2030-03-01",
    interval: 1,
    month: 8,
    dayOfMonth: 15,
});

console.assert(
    JSON.stringify(partialYearlyRange) ===
        JSON.stringify([
            "2028-08-15",
            "2029-08-15",
        ]),
    "Yearly partial-range test failed."
);

// ==========================================
// Test 21: Invalid Month
// ==========================================

try {
    getYearlyOccurrences({
        startDate: "2026-01-01",
        endDate: "2030-12-31",
        interval: 1,
        month: 13,
        dayOfMonth: 15,
    });

    console.assert(
        false,
        "Expected invalid month to be rejected."
    );
} catch (error) {
    console.log(
        "✅ Invalid month rejected."
    );
}

// ==========================================
// Test 22: Invalid Yearly Day
// ==========================================

try {
    getYearlyOccurrences({
        startDate: "2026-01-01",
        endDate: "2030-12-31",
        interval: 1,
        month: 8,
        dayOfMonth: 32,
    });

    console.assert(
        false,
        "Expected invalid yearly day to be rejected."
    );
} catch (error) {
    console.log(
        "✅ Invalid yearly day rejected."
    );
}

console.log(
    "✅ Yearly recurrence tests passed."
);

