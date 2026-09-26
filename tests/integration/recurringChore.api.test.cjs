const assert = require("node:assert/strict");
const test = require("node:test");
const mongoose = require("mongoose");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const MONGO_URI = process.env.TEST_MONGO_URI;
const describeIntegration = MONGO_URI ? test : test.skip;

let app;
let server;
let User;
let Household;
let Membership;
let Chore;
let RecurringChoreTemplate;

const ids = {
    householdId: new mongoose.Types.ObjectId()
};

const unique = (prefix) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const makeToken = (userId) =>
    jwt.sign(
        { userId: userId.toString() },
        process.env.JWT_SECRET || "integration-test-secret"
    );

const request = async (path, options = {}) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const text = await response.text();

    return {
        response,
        body: text ? JSON.parse(text) : null
    };
};

describeIntegration("Recurring chore API integration", async (t) => {
    await t.test("starts the API against the configured test database", async () => {
        process.env.JWT_SECRET ||= "integration-test-secret";

        User = (await import("../../src/models/User.js")).default;
        Household = (await import("../../src/models/Household.js")).default;
        Membership = (await import("../../src/models/Membership.js")).default;
        Chore = (await import("../../src/models/Chore.js")).default;
        RecurringChoreTemplate =
            (await import("../../src/models/RecurringChoreTemplate.js")).default;
        ({ default: app } = await import("../../src/server.js"));

        await mongoose.connect(MONGO_URI);
        server = await new Promise((resolve) => {
            const httpServer = app.listen(0, () => resolve(httpServer));
        });

        assert.equal(mongoose.connection.readyState, 1);
        assert.ok(server.address().port > 0);
    });

    await t.test("admin can create and member can list and view a recurring template", async () => {
        const admin = await User.create({
            username: unique("admin"),
            email: `${unique("admin")}@example.com`,
            password: "test-password"
        });

        const member = await User.create({
            username: unique("member"),
            email: `${unique("member")}@example.com`,
            password: "test-password"
        });

        await Household.create({
            _id: ids.householdId,
            name: unique("Household"),
            inviteCode: unique("invite"),
            createdBy: admin._id
        });

        await Membership.create([
            {
                userId: admin._id,
                householdId: ids.householdId,
                role: "admin"
            },
            {
                userId: member._id,
                householdId: ids.householdId,
                role: "member"
            }
        ]);

        const adminToken = makeToken(admin._id);
        const memberToken = makeToken(member._id);

        const create = await request("/api/recurring-chores", {
            method: "POST",
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                householdId: ids.householdId.toString(),
                title: unique("Take out trash"),
                description: "Recurring household trash duty",
                assignment: {
                    strategy: "fixed",
                    assignedTo: member._id.toString()
                },
                schedule: {
                    frequency: "daily",
                    interval: 1,
                    weekdays: [],
                    dayOfMonth: null,
                    month: null,
                    monthlyRule: null
                },
                metadata: {
                    category: "cleaning",
                    difficulty: 3,
                    estimatedDuration: 15,
                    tags: ["trash", "daily"]
                },
                notification: {
                    enabled: false,
                    reminderOffset: {
                        value: null,
                        unit: null
                    }
                },
                activePeriod: {
                    startsAt: "2026-09-26T00:00:00.000Z",
                    endsAt: null
                }
            })
        });

        assert.equal(create.response.status, 201);
        assert.ok(create.body.template._id);
        assert.equal(create.body.template.householdId, ids.householdId.toString());

        const templateId = create.body.template._id;

        const list = await request(
            `/api/recurring-chores?householdId=${ids.householdId}`,
            {
                headers: { Authorization: `Bearer ${memberToken}` }
            }
        );

        assert.equal(list.response.status, 200);
        assert.ok(
            list.body.templates.some(
                (template) => template._id === templateId
            )
        );

        const detail = await request(
            `/api/recurring-chores/${templateId}`,
            {
                headers: { Authorization: `Bearer ${memberToken}` }
            }
        );

        assert.equal(detail.response.status, 200);
        assert.equal(detail.body.template._id, templateId);
    });

    await t.test("member cannot create a recurring template", async () => {
        const member = await User.findOne({
            _id: {
                $in: await Membership.find({
                    householdId: ids.householdId,
                    role: "member"
                }).distinct("userId")
            }
        });

        const response = await request("/api/recurring-chores", {
            method: "POST",
            headers: { Authorization: `Bearer ${makeToken(member._id)}` },
            body: JSON.stringify({
                householdId: ids.householdId.toString(),
                title: unique("Member attempt")
            })
        });

        assert.equal(response.response.status, 403);
    });

    await t.test("admin can update, manually generate, and delete the template", async () => {
        const adminMembership = await Membership.findOne({
            householdId: ids.householdId,
            role: "admin"
        });
        const adminToken = makeToken(adminMembership.userId);
        const template = await RecurringChoreTemplate.findOne({
            householdId: ids.householdId
        });

        assert.ok(template);

        const update = await request(
            `/api/recurring-chores/${template._id}`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${adminToken}` },
                body: JSON.stringify({
                    description: "Updated recurring description"
                })
            }
        );

        assert.equal(update.response.status, 200);
        assert.equal(
            update.body.template.description,
            "Updated recurring description"
        );

        const generate = await request(
            `/api/recurring-chores/${template._id}/generate`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${adminToken}` },
                body: JSON.stringify({
                    occurrenceDate: "2026-09-27"
                })
            }
        );

        assert.equal(generate.response.status, 201);
        assert.equal(generate.body.chore.choreType, "recurring");
        assert.equal(
            generate.body.chore.recurringTemplateId,
            template._id.toString()
        );
        assert.equal(generate.body.chore.generationType, "manual");

        const choreCount = await Chore.countDocuments({
            recurringTemplateId: template._id,
            occurrenceDate: new Date("2026-09-27T00:00:00.000Z")
        });

        assert.equal(choreCount, 1);

        const duplicateGenerate = await request(
            `/api/recurring-chores/${template._id}/generate`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${adminToken}` },
                body: JSON.stringify({
                    occurrenceDate: "2026-09-27"
                })
            }
        );

        assert.equal(duplicateGenerate.response.status, 200);

        const deleted = await request(
            `/api/recurring-chores/${template._id}`,
            {
                method: "DELETE",
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        assert.equal(deleted.response.status, 200);
        assert.equal(
            await RecurringChoreTemplate.exists({ _id: template._id }),
            null
        );
    });

    t.after(async () => {
        await Chore?.deleteMany({ householdId: ids.householdId });
        await RecurringChoreTemplate?.deleteMany({
            householdId: ids.householdId
        });
        await Membership?.deleteMany({ householdId: ids.householdId });
        await User?.deleteMany({
            _id: {
                $in: await Membership?.find({
                    householdId: ids.householdId
                }).distinct("userId") || []
            }
        });
        await Household?.deleteMany({ _id: ids.householdId });

        await new Promise((resolve) => {
            if (!server) {
                resolve();
                return;
            }
            server.close(resolve);
        });

        await mongoose.disconnect();
    });
});
