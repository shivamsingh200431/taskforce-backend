const assert = require("node:assert/strict");
const test = require("node:test");

const {
    generateOccurrence,
    processTemplate,
    normalizeOccurrenceDate,
    getNextOccurrence
} = require("../../src/services/recurringChore.service.cjs");

const template = {
    _id: "template-1",
    title: "Wash dishes",
    description: "Kitchen dishes",
    householdId: "household-1",
    createdBy: "admin-1",
    assignment: { strategy: "fixed", assignedTo: "user-1" },
    schedule: {
        frequency: "daily",
        interval: 1
    },
    metadata: {
        category: "cleaning",
        difficulty: 3,
        estimatedDuration: 20,
        tags: ["kitchen"]
    },
    activePeriod: {
        startsAt: new Date("2026-09-24T00:00:00.000Z"),
        endsAt: null
    },
    schedulerMetadata: {
        nextRunAt: new Date("2026-09-24T00:00:00.000Z"),
        lastProcessedAt: null
    }
};

test("normalizes utility date strings and Date values to Date instances", () => {
    assert.equal(
        normalizeOccurrenceDate("2026-09-26").getTime(),
        new Date("2026-09-26T00:00:00.000Z").getTime()
    );
    assert.equal(
        normalizeOccurrenceDate(new Date("2026-09-26T00:00:00.000Z")).getTime(),
        new Date("2026-09-26T00:00:00.000Z").getTime()
    );
});

test("generated occurrence snapshots template fields and resolved assignee", async () => {
    let created;

    const ChoreModel = {
        findOne: async () => null,
        create: async (payload) => {
            created = payload;
            return { ...payload, _id: "chore-1" };
        }
    };

    const result = await generateOccurrence(
        template,
        new Date("2026-09-26T00:00:00.000Z"),
        {
            ChoreModel,
            resolveAssigneeFn: async () => ({
                ok: true,
                assignee: "user-1"
            })
        }
    );

    assert.equal(result.created, true);
    assert.equal(created.title, "Wash dishes");
    assert.equal(created.description, "Kitchen dishes");
    assert.equal(created.householdId, "household-1");
    assert.equal(created.assignedTo, "user-1");
    assert.equal(created.createdBy, "admin-1");
    assert.equal(created.choreType, "recurring");
    assert.equal(created.source, "admin-assigned");
    assert.equal(created.approvedDifficulty, 3);
    assert.equal(created.recurringTemplateId, "template-1");
    assert.equal(created.generationType, "normal");
    assert.equal(created.occurrenceDate.toISOString(), "2026-09-26T00:00:00.000Z");
    assert.equal(created.dueDate.toISOString(), "2026-09-26T00:00:00.000Z");
});

test("manual generation uses manual generation type", async () => {
    let created;

    const result = await generateOccurrence(
        template,
        new Date("2026-09-26T00:00:00.000Z"),
        {
            generationType: "manual",
            ChoreModel: {
                findOne: async () => null,
                create: async (payload) => {
                    created = payload;
                    return payload;
                }
            },
            resolveAssigneeFn: async () => ({
                ok: true,
                assignee: "user-1"
            })
        }
    );

    assert.equal(result.created, true);
    assert.equal(created.generationType, "manual");
});

test("assignment failure prevents an unassigned recurring chore", async () => {
    let createCalled = false;

    const result = await generateOccurrence(
        template,
        new Date("2026-09-26T00:00:00.000Z"),
        {
            ChoreModel: {
                findOne: async () => null,
                create: async () => {
                    createCalled = true;
                }
            },
            resolveAssigneeFn: async () => ({
                ok: false,
                reason: "no_eligible_members"
            })
        }
    );

    assert.deepEqual(result, {
        created: false,
        reason: "no_eligible_members"
    });
    assert.equal(createCalled, false);
});

test("duplicate occurrence is treated as idempotent success", async () => {
    const existing = { _id: "existing", title: "Wash dishes" };

    const ChoreModel = {
        findOne: () => ({
            lean: async () => null
        }),
        create: async () => {
            const error = new Error("duplicate");
            error.code = 11000;
            throw error;
        },
        findOne: () => ({
            lean: async () => existing
        })
    };

    const result = await generateOccurrence(
        template,
        new Date("2026-09-26T00:00:00.000Z"),
        {
            ChoreModel,
            resolveAssigneeFn: async () => ({
                ok: true,
                assignee: "user-1"
            })
        }
    );

    assert.equal(result.created, false);
    assert.equal(result.idempotent, true);
    assert.equal(result.chore, existing);
});

test("existing occurrence is idempotent before assignee resolution", async () => {
    const existing = {
        _id: "existing",
        recurringTemplateId: template._id,
        occurrenceDate: new Date("2026-09-26T00:00:00.000Z")
    };
    let resolverCalled = false;
    let createCalled = false;

    const ChoreModel = {
        findOne: () => ({
            lean: async () => existing
        }),
        create: async () => {
            createCalled = true;
        }
    };

    const result = await generateOccurrence(
        template,
        new Date("2026-09-26T00:00:00.000Z"),
        {
            ChoreModel,
            resolveAssigneeFn: async () => {
                resolverCalled = true;
                return {
                    ok: false,
                    reason: "fixed_assignee_not_eligible"
                };
            }
        }
    );

    assert.equal(result.created, false);
    assert.equal(result.idempotent, true);
    assert.equal(result.chore, existing);
    assert.equal(resolverCalled, false);
    assert.equal(createCalled, false);
});

test("processTemplate generates all due occurrences and returns scheduler updates", async () => {
    const generated = [];

    let recurrenceCallCount = 0;
    const recurrenceUtils = {
        getDailyOccurrences: () => {
            recurrenceCallCount++;
            return recurrenceCallCount === 1
                ? [
                    new Date("2026-09-24T00:00:00.000Z"),
                    new Date("2026-09-25T00:00:00.000Z"),
                    new Date("2026-09-26T00:00:00.000Z")
                ]
                : [new Date("2026-09-27T00:00:00.000Z")];
        }
    };

    const result = await processTemplate(
        template,
        new Date("2026-09-26T12:00:00.000Z"),
        {
            recurrenceUtils,
            generateOccurrenceFn: async (_template, date, options) => {
                generated.push({
                    date,
                    generationType: options.generationType
                });
                return { created: true };
            }
        }
    );

    assert.equal(generated.length, 3);
    assert.equal(generated[0].generationType, "recovery");
    assert.equal(generated[1].generationType, "recovery");
    assert.equal(generated[2].generationType, "normal");
    assert.equal(result.lastProcessedAt.toISOString(), "2026-09-26T00:00:00.000Z");
    assert.ok(result.nextRunAt instanceof Date);
});

test("processTemplate bounds automatic catch-up to the configured window", async () => {
    const receivedStartDates = [];

    const oldTemplate = {
        ...template,
        activePeriod: {
            startsAt: new Date("2026-01-01T00:00:00.000Z"),
            endsAt: null
        }
    };

    const now = new Date("2026-09-26T12:00:00.000Z");
    const expectedStart = new Date("2026-08-27T12:00:00.000Z");

    const recurrenceUtils = {
        getDailyOccurrences: ({ startDate }) => {
            receivedStartDates.push(startDate);
            return [new Date("2026-09-26T00:00:00.000Z")];
        }
    };

    const result = await processTemplate(
        oldTemplate,
        now,
        {
            recurrenceUtils,
            catchUpDays: 30,
            generateOccurrenceFn: async () => ({ created: true })
        }
    );

    assert.equal(receivedStartDates[0], expectedStart.toISOString().slice(0, 10));
    assert.equal(result.occurrencesProcessed, 1);
});

test("processTemplate resumes from the next calendar day after the last processed occurrence", async () => {
    const resumedStartDates = [];

    const processedTemplate = {
        ...template,
        schedulerMetadata: {
            ...template.schedulerMetadata,
            lastProcessedAt: new Date("2026-09-26T00:00:00.000Z")
        }
    };

    const recurrenceUtils = {
        getDailyOccurrences: ({ startDate }) => {
            resumedStartDates.push(startDate);
            return [new Date("2026-09-27T00:00:00.000Z")];
        }
    };

    await processTemplate(
        processedTemplate,
        new Date("2026-09-27T12:00:00.000Z"),
        {
            recurrenceUtils,
            generateOccurrenceFn: async () => ({ created: true })
        }
    );

    assert.equal(resumedStartDates[0], "2026-09-27");
});

test("processTemplate preserves recurrence phase after the last processed occurrence", async () => {
    const generated = [];

    const intervalTemplate = {
        ...template,
        schedule: {
            ...template.schedule,
            frequency: "daily",
            interval: 2
        },
        activePeriod: {
            startsAt: new Date("2026-09-24T00:00:00.000Z"),
            endsAt: null
        },
        schedulerMetadata: {
            ...template.schedulerMetadata,
            nextRunAt: new Date("2026-09-26T00:00:00.000Z"),
            lastProcessedAt: new Date("2026-09-24T00:00:00.000Z")
        }
    };

    const result = await processTemplate(
        intervalTemplate,
        new Date("2026-09-27T12:00:00.000Z"),
        {
            generateOccurrenceFn: async (_template, date) => {
                generated.push(date);
                return { created: true };
            }
        }
    );

    assert.deepEqual(
        generated.map((date) => date.toISOString()),
        ["2026-09-26T00:00:00.000Z"]
    );
    assert.equal(
        result.lastProcessedAt.toISOString(),
        "2026-09-26T00:00:00.000Z"
    );
});

test("getNextOccurrence respects a future active period", async () => {
    const futureTemplate = {
        ...template,
        activePeriod: {
            startsAt: new Date("2026-10-05T00:00:00.000Z"),
            endsAt: null
        }
    };

    const recurrenceUtils = {
        getDailyOccurrences: ({ startDate }) => [
            new Date("2026-10-05T00:00:00.000Z")
        ]
    };

    const result = await getNextOccurrence(
        futureTemplate,
        new Date("2026-09-27T12:00:00.000Z"),
        recurrenceUtils
    );

    assert.equal(result.toISOString(), "2026-10-05T00:00:00.000Z");
});

test("getNextOccurrence preserves the interval phase without scanning old history", async () => {
    const oldTemplate = {
        ...template,
        schedule: {
            frequency: "daily",
            interval: 3
        },
        activePeriod: {
            startsAt: new Date("2020-01-01T00:00:00.000Z"),
            endsAt: null
        }
    };

    let receivedArgs;

    const recurrenceUtils = {
        getDailyOccurrences: (args) => {
            receivedArgs = args;
            return [
                new Date("2026-09-26T00:00:00.000Z"),
                new Date("2026-09-29T00:00:00.000Z")
            ];
        }
    };

    const result = await getNextOccurrence(
        oldTemplate,
        new Date("2026-09-27T12:00:00.000Z"),
        recurrenceUtils
    );

    assert.equal(receivedArgs.startDate, "2026-09-26");
    assert.equal(receivedArgs.endDate, "2026-10-01");
    assert.equal(result.toISOString(), "2026-09-29T00:00:00.000Z");
});

test("getNextOccurrence supports intervals beyond the old fixed horizons", async () => {
    const cases = [
        {
            frequency: "daily",
            interval: 500,
            activeStart: "2026-09-26T00:00:00.000Z",
            now: "2026-09-27T12:00:00.000Z",
            expected: "2028-02-08T00:00:00.000Z"
        },
        {
            frequency: "weekly",
            interval: 100,
            activeStart: "2026-01-07T00:00:00.000Z",
            now: "2026-09-27T12:00:00.000Z",
            expected: "2027-12-06T00:00:00.000Z"
        },
        {
            frequency: "monthly",
            interval: 100,
            activeStart: "2026-01-15T00:00:00.000Z",
            now: "2026-09-10T12:00:00.000Z",
            expected: "2034-05-15T00:00:00.000Z"
        },
        {
            frequency: "yearly",
            interval: 30,
            activeStart: "2020-05-10T00:00:00.000Z",
            now: "2026-06-01T12:00:00.000Z",
            expected: "2050-05-10T00:00:00.000Z"
        }
    ];

    for (const testCase of cases) {
        let functionName;
        const recurrenceUtils = {};

        if (testCase.frequency === "daily") {
            functionName = "getDailyOccurrences";
        } else if (testCase.frequency === "weekly") {
            functionName = "getWeeklyOccurrences";
        } else if (testCase.frequency === "monthly") {
            functionName = "getMonthlyOccurrences";
        } else {
            functionName = "getYearlyOccurrences";
        }

        recurrenceUtils[functionName] = ({ endDate }) => {
            assert.ok(endDate >= testCase.expected.slice(0, 10));
            return [new Date(testCase.expected)];
        };

        const frequencyTemplate = {
            ...template,
            schedule: {
                ...template.schedule,
                frequency: testCase.frequency,
                interval: testCase.interval,
                weekdays: testCase.frequency === "weekly" ? [1] : [],
                monthlyRule: testCase.frequency === "monthly" ? "FIXED_DAY" : null,
                dayOfMonth: testCase.frequency === "monthly" ? 15 : testCase.frequency === "yearly" ? 10 : null,
                month: testCase.frequency === "yearly" ? 5 : null
            },
            activePeriod: {
                startsAt: new Date(testCase.activeStart),
                endsAt: null
            }
        };

        const result = await getNextOccurrence(
            frequencyTemplate,
            new Date(testCase.now),
            recurrenceUtils
        );

        assert.equal(result.toISOString(), testCase.expected);
    }
});

test("getNextOccurrence searches past invalid monthly calendar dates", async () => {
    const monthlyTemplate = {
        ...template,
        schedule: {
            frequency: "monthly",
            interval: 2,
            weekdays: [],
            dayOfMonth: 31,
            month: null,
            monthlyRule: "fixedDay"
        },
        activePeriod: {
            startsAt: new Date("2026-02-01T00:00:00.000Z"),
            endsAt: null
        }
    };

    const result = await getNextOccurrence(
        monthlyTemplate,
        new Date("2026-02-02T12:00:00.000Z")
    );

    assert.equal(
        result.toISOString(),
        "2026-08-31T00:00:00.000Z"
    );
});

test("getNextOccurrence searches past invalid yearly calendar dates", async () => {
    const yearlyTemplate = {
        ...template,
        schedule: {
            frequency: "yearly",
            interval: 1,
            weekdays: [],
            dayOfMonth: 29,
            month: 2,
            monthlyRule: null
        },
        activePeriod: {
            startsAt: new Date("2025-01-01T00:00:00.000Z"),
            endsAt: null
        }
    };

    const result = await getNextOccurrence(
        yearlyTemplate,
        new Date("2026-03-01T12:00:00.000Z")
    );

    assert.equal(
        result.toISOString(),
        "2028-02-29T00:00:00.000Z"
    );
});

test("getNextOccurrence handles a monthly February 29 recurrence across leap cycles", async () => {
    const monthlyTemplate = {
        ...template,
        schedule: {
            frequency: "monthly",
            interval: 12,
            weekdays: [],
            dayOfMonth: 29,
            month: null,
            monthlyRule: "fixedDay"
        },
        activePeriod: {
            startsAt: new Date("2026-02-01T00:00:00.000Z"),
            endsAt: null
        }
    };

    const result = await getNextOccurrence(
        monthlyTemplate,
        new Date("2028-03-01T12:00:00.000Z")
    );

    assert.equal(
        result.toISOString(),
        "2032-02-29T00:00:00.000Z"
    );
});

test("getNextOccurrence handles a yearly February 29 recurrence across century years", async () => {
    const yearlyTemplate = {
        ...template,
        schedule: {
            frequency: "yearly",
            interval: 4,
            weekdays: [],
            dayOfMonth: 29,
            month: 2,
            monthlyRule: null
        },
        activePeriod: {
            startsAt: new Date("2096-02-29T00:00:00.000Z"),
            endsAt: null
        }
    };

    const result = await getNextOccurrence(
        yearlyTemplate,
        new Date("2097-03-01T12:00:00.000Z")
    );

    assert.equal(
        result.toISOString(),
        "2104-02-29T00:00:00.000Z"
    );
});

test("getNextOccurrence returns null after the active period ends", async () => {
    const endedTemplate = {
        ...template,
        activePeriod: {
            startsAt: new Date("2026-09-01T00:00:00.000Z"),
            endsAt: new Date("2026-09-27T00:00:00.000Z")
        }
    };

    let recurrenceCalled = false;

    const recurrenceUtils = {
        getDailyOccurrences: () => {
            recurrenceCalled = true;
            return [];
        }
    };

    const result = await getNextOccurrence(
        endedTemplate,
        new Date("2026-09-27T12:00:00.000Z"),
        recurrenceUtils
    );

    assert.equal(result, null);
    assert.equal(recurrenceCalled, false);
});


test("getNextOccurrence preserves interval phase for weekly, monthly, and yearly schedules", async () => {
    const cases = [
        {
            frequency: "weekly",
            interval: 2,
            activeStart: "2026-01-07T00:00:00.000Z",
            now: "2026-09-27T12:00:00.000Z",
            recurrence: {
                getWeeklyOccurrences: (args) => {
                    assert.equal(args.startDate, "2026-09-27");
                    return [new Date("2026-10-04T00:00:00.000Z")];
                }
            },
            expected: "2026-10-04T00:00:00.000Z"
        },
        {
            frequency: "monthly",
            interval: 2,
            activeStart: "2026-01-15T00:00:00.000Z",
            now: "2026-09-10T12:00:00.000Z",
            recurrence: {
                getMonthlyOccurrences: (args) => {
                    assert.equal(args.startDate, "2026-09-01");
                    return [new Date("2026-09-15T00:00:00.000Z")];
                }
            },
            expected: "2026-09-15T00:00:00.000Z"
        },
        {
            frequency: "yearly",
            interval: 2,
            activeStart: "2020-05-10T00:00:00.000Z",
            now: "2026-06-01T12:00:00.000Z",
            recurrence: {
                getYearlyOccurrences: (args) => {
                    assert.equal(args.startDate, "2026-01-01");
                    return [new Date("2026-05-10T00:00:00.000Z"), new Date("2028-05-10T00:00:00.000Z")];
                }
            },
            expected: "2028-05-10T00:00:00.000Z"
        }
    ];

    for (const testCase of cases) {
        const frequencyTemplate = {
            ...template,
            schedule: {
                ...template.schedule,
                frequency: testCase.frequency,
                interval: testCase.interval,
                weekdays: testCase.frequency === "weekly" ? [0] : [],
                monthlyRule: testCase.frequency === "monthly" ? "FIXED_DAY" : null,
                dayOfMonth: testCase.frequency === "monthly" ? 15 : testCase.frequency === "yearly" ? 10 : null,
                month: testCase.frequency === "yearly" ? 5 : null
            },
            activePeriod: {
                startsAt: new Date(testCase.activeStart),
                endsAt: null
            }
        };

        const result = await getNextOccurrence(
            frequencyTemplate,
            new Date(testCase.now),
            testCase.recurrence
        );

        assert.equal(result.toISOString(), testCase.expected);
    }
});
