const assert = require("node:assert/strict");
const test = require("node:test");

const {
    startSchedulerLoop
} = require("../../src/services/recurringScheduler.service.cjs");

test("scheduler loop does not overlap ticks", async () => {
    let active = 0;
    let maxActive = 0;
    let resolveFirst;

    const firstTick = new Promise((resolve) => {
        resolveFirst = resolve;
    });

    const runTick = async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await firstTick;
        active -= 1;
    };

    let callback;
    const timer = {
        unref() {}
    };

    const scheduler = startSchedulerLoop({
        runTick,
        intervalMs: 1,
        setIntervalFn: (fn) => {
            callback = fn;
            return timer;
        }
    });

    const first = callback();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = callback();

    resolveFirst();

    await Promise.all([first, second]);

    scheduler.stop();

    assert.equal(maxActive, 1);
});
