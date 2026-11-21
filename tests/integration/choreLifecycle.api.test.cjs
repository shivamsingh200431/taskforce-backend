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
let admin;
let member;
let outsider;
let adminToken;
let memberToken;
let outsiderToken;

const householdId = new mongoose.Types.ObjectId();
const unique = (prefix) => `${prefix}${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}`;

const makeToken = (userId) => jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET
);

const request = async (path, options = {}) => {
    const response = await fetch(
        `http://127.0.0.1:${server.address().port}${path}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    const text = await response.text();

    return {
        response,
        body: text ? JSON.parse(text) : null
    };
};

const createSubmission = async (title) => {
    const result = await request("/api/chores", {
        method: "POST",
        headers: { Authorization: `Bearer ${memberToken}` },
        body: JSON.stringify({
            title,
            description: "Member-submitted household work",
            householdId: householdId.toString(),
            choreType: "one-time",
            suggestedDifficulty: 3
        })
    });

    assert.equal(result.response.status, 201);
    return result.body.chore.id;
};

const fetchChore = (id) => Chore.findById(id).lean();

describeIntegration("Chore review lifecycle API", async (t) => {
    await t.test("connects the API to an isolated MongoDB database", async () => {
        process.env.JWT_SECRET ||= "chore-lifecycle-integration-secret";

        await mongoose.connect(MONGO_URI, {
            dbName: "taskforce_chore_lifecycle_integration"
        });

        User = (await import("../../src/models/User.js")).default;
        Household = (await import("../../src/models/Household.js")).default;
        Membership = (await import("../../src/models/Membership.js")).default;
        Chore = (await import("../../src/models/Chore.js")).default;
        ({ default: app } = await import("../../src/server.js"));

        server = await new Promise((resolve) => {
            const httpServer = app.listen(0, () => resolve(httpServer));
        });

        assert.equal(mongoose.connection.readyState, 1);
        assert.ok(server.address().port > 0);
    });

    await t.test("creates admin, member, and outsider fixtures", async () => {
        admin = await User.create({
            username: unique("admin"),
            email: `${unique("admin")}@example.com`,
            password: "test-password"
        });
        member = await User.create({
            username: unique("member"),
            email: `${unique("member")}@example.com`,
            password: "test-password"
        });
        outsider = await User.create({
            username: unique("outsider"),
            email: `${unique("outsider")}@example.com`,
            password: "test-password"
        });

        await Household.create({
            _id: householdId,
            name: unique("Household"),
            inviteCode: unique("invite"),
            createdBy: admin._id
        });

        await Membership.create([
            { userId: admin._id, householdId, role: "admin" },
            { userId: member._id, householdId, role: "member" }
        ]);

        adminToken = makeToken(admin._id);
        memberToken = makeToken(member._id);
        outsiderToken = makeToken(outsider._id);
    });

    await t.test("needs-improvement can be resubmitted and approved", async () => {
        const choreId = await createSubmission("Clean the kitchen");

        let chore = await fetchChore(choreId);
        assert.equal(chore.source, "member-submitted");
        assert.equal(chore.approvalStatus, "pending");
        assert.equal(chore.completionStatus, "pending");
        assert.deepEqual(
            chore.reviewHistory.map((entry) => entry.action),
            ["submitted"]
        );

        const review = await request(`/api/chores/${choreId}/approve`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                needsImprovement: true,
                feedback: "Please clean the counter as well."
            })
        });

        assert.equal(review.response.status, 200);
        assert.equal(review.body.chore.approvalStatus, "needs-improvement");
        assert.equal(review.body.chore.completionStatus, "pending");
        assert.equal(review.body.chore.feedback, "Please clean the counter as well.");

        const prematureCompletion = await request(
            `/api/chores/${choreId}/complete`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${memberToken}` }
            }
        );
        assert.equal(prematureCompletion.response.status, 400);

        const repeatedReview = await request(
            `/api/chores/${choreId}/reject`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${adminToken}` },
                body: JSON.stringify({ feedback: "Duplicate review" })
            }
        );
        assert.equal(repeatedReview.response.status, 400);

        const wrongActorResubmit = await request(
            `/api/chores/${choreId}/resubmit`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${adminToken}` },
                body: JSON.stringify({})
            }
        );
        assert.equal(wrongActorResubmit.response.status, 403);

        const outsiderResubmit = await request(
            `/api/chores/${choreId}/resubmit`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${outsiderToken}` },
                body: JSON.stringify({})
            }
        );
        assert.equal(outsiderResubmit.response.status, 403);

        const invalidResubmit = await request(
            `/api/chores/${choreId}/resubmit`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${memberToken}` },
                body: JSON.stringify({ suggestedDifficulty: 6 })
            }
        );
        assert.equal(invalidResubmit.response.status, 400);
        chore = await fetchChore(choreId);
        assert.equal(chore.approvalStatus, "needs-improvement");

        const resubmit = await request(
            `/api/chores/${choreId}/resubmit`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${memberToken}` },
                body: JSON.stringify({
                    description: "Counter cleaned and kitchen floor mopped.",
                    suggestedDifficulty: 4
                })
            }
        );

        assert.equal(resubmit.response.status, 200);
        assert.equal(resubmit.body.chore.approvalStatus, "pending");
        assert.equal(resubmit.body.chore.completionStatus, "pending");
        assert.equal(resubmit.body.chore.feedback, "");
        assert.equal(resubmit.body.chore.suggestedDifficulty, 4);
        assert.deepEqual(
            resubmit.body.chore.reviewHistory.map((entry) => entry.action),
            ["submitted", "needs-improvement", "resubmitted"]
        );
        assert.equal(
            resubmit.body.chore.reviewHistory[1].feedback,
            "Please clean the counter as well."
        );

        const duplicateResubmit = await request(
            `/api/chores/${choreId}/resubmit`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${memberToken}` },
                body: JSON.stringify({})
            }
        );
        assert.equal(duplicateResubmit.response.status, 400);

        const finalApproval = await request(
            `/api/chores/${choreId}/approve`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${adminToken}` },
                body: JSON.stringify({
                    needsImprovement: false,
                    approvedDifficulty: 4,
                    feedback: "Accepted."
                })
            }
        );

        assert.equal(finalApproval.response.status, 200);
        assert.equal(finalApproval.body.chore.approvalStatus, "approved");
        assert.equal(finalApproval.body.chore.completionStatus, "completed");
        assert.deepEqual(
            finalApproval.body.chore.reviewHistory.map((entry) => entry.action),
            ["submitted", "needs-improvement", "resubmitted", "approved"]
        );

        const list = await request(
            `/api/chores?householdId=${householdId}`,
            { headers: { Authorization: `Bearer ${memberToken}` } }
        );
        assert.equal(list.response.status, 200);
        const listed = list.body.chores.find((item) => item.id === choreId);
        assert.ok(listed);
        assert.equal(listed.reviewHistory.length, 4);
        assert.equal(listed.reviewHistory[0].actor, member.username);
    });

    await t.test("rejected submissions can be revised and re-reviewed", async () => {
        const choreId = await createSubmission("Wash the dishes");

        const rejection = await request(
            `/api/chores/${choreId}/reject`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${adminToken}` },
                body: JSON.stringify({
                    feedback: "Some dishes were left in the sink."
                })
            }
        );

        assert.equal(rejection.response.status, 200);
        assert.equal(rejection.body.chore.approvalStatus, "rejected");
        assert.equal(rejection.body.chore.completionStatus, "pending");

        const resubmit = await request(
            `/api/chores/${choreId}/resubmit`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${memberToken}` },
                body: JSON.stringify({ title: "Wash all dishes" })
            }
        );

        assert.equal(resubmit.response.status, 200);
        assert.equal(resubmit.body.chore.title, "Wash all dishes");
        assert.equal(resubmit.body.chore.approvalStatus, "pending");
        assert.equal(resubmit.body.chore.feedback, "");
        assert.equal(
            resubmit.body.chore.reviewHistory[1].feedback,
            "Some dishes were left in the sink."
        );

        const reReview = await request(
            `/api/chores/${choreId}/approve`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${adminToken}` },
                body: JSON.stringify({ needsImprovement: false })
            }
        );

        assert.equal(reReview.response.status, 200);
        assert.equal(reReview.body.chore.approvalStatus, "approved");
        assert.equal(reReview.body.chore.completionStatus, "completed");
    });

    await t.test("admin-assigned chores use the completion flow, not review or resubmission", async () => {
        const created = await request("/api/chores", {
            method: "POST",
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                title: "Take out the rubbish",
                description: "Empty the kitchen bin.",
                householdId: householdId.toString(),
                assignedTo: member._id.toString(),
                choreType: "one-time",
                suggestedDifficulty: 2
            })
        });

        assert.equal(created.response.status, 201);
        const choreId = created.body.chore.id;

        const resubmit = await request(
            `/api/chores/${choreId}/resubmit`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${memberToken}` },
                body: JSON.stringify({})
            }
        );
        assert.equal(resubmit.response.status, 400);

        const review = await request(
            `/api/chores/${choreId}/approve`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${adminToken}` },
                body: JSON.stringify({ needsImprovement: true })
            }
        );
        assert.equal(review.response.status, 400);

        const completion = await request(
            `/api/chores/${choreId}/complete`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${memberToken}` }
            }
        );
        assert.equal(completion.response.status, 200);
        assert.equal(completion.body.chore.completionStatus, "completed");

        const duplicateCompletion = await request(
            `/api/chores/${choreId}/complete`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${memberToken}` }
            }
        );
        assert.equal(duplicateCompletion.response.status, 400);
    });

    await t.test("invalid review decisions do not change the submission", async () => {
        const choreId = await createSubmission("Sweep the hallway");

        const invalidDecision = await request(
            `/api/chores/${choreId}/approve`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${adminToken}` },
                body: JSON.stringify({ needsImprovement: "true" })
            }
        );

        assert.equal(invalidDecision.response.status, 400);
        const chore = await fetchChore(choreId);
        assert.equal(chore.approvalStatus, "pending");
        assert.equal(chore.reviewHistory.length, 1);
    });

    t.after(async () => {
        await Chore?.deleteMany({ householdId });
        await Membership?.deleteMany({ householdId });
        const userIds = [admin?._id, member?._id, outsider?._id].filter(Boolean);
        await User?.deleteMany({ _id: { $in: userIds } });
        await Household?.deleteOne({ _id: householdId });

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
