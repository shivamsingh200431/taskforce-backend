const assert = require("node:assert/strict");
const test = require("node:test");

test("recurring API exposes the planned route surface", async () => {
    const routes = (await import("../../src/routes/recurringChoreRoutes.js")).default;
    assert.ok(routes);
});
