import {
    getDailyOccurrences,
    getWeeklyOccurrences,
} from "./recurrence.utils.js";

import {
    WEEKDAY,
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
    "✅ Daily recurrence tests passed."
);