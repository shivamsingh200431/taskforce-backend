const assert = require("node:assert/strict");
const test = require("node:test");

test("recurring API exposes the planned route surface", () => {
    const routes = require("../../src/routes/recurringChoreRoutes");
    assert.ok(routes);
});
