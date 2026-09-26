import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import mongoose from "mongoose";

async function loadChoreModel() {
    const source = await readFile(
        new URL("../../src/models/Chore.js", import.meta.url),
        "utf8"
    );

    let exportedModel;

    const sandbox = {
        require(request) {
            if (request === "mongoose") {
                return mongoose;
            }

            throw new Error(`Unexpected require: ${request}`);
        },
        module: {
            exports: {},
        },
        exports: {},
        console,
    };

    vm.runInNewContext(source, sandbox, {
        filename: "src/models/Chore.js",
    });

    exportedModel = sandbox.module.exports;
    return exportedModel;
}

const Chore = await loadChoreModel();

const ids = {
    householdId: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    templateId: new mongoose.Types.ObjectId(),
};

function baseChore(overrides = {}) {
    return new Chore({
        title: "Wash dishes",
        description: "Clean the kitchen dishes",
        householdId: ids.householdId,
        assignedTo: ids.userId,
        createdBy: ids.userId,
        choreType: "recurring",
        source: "admin-assigned",
        recurringTemplateId: ids.templateId,
        occurrenceDate: new Date("2026-09-26T00:00:00.000Z"),
        generationType: "normal",
        ...overrides,
    });
}

test("recurring Chore stores occurrence identity and generation type", () => {
    const chore = baseChore();

    assert.equal(
        chore.recurringTemplateId.toString(),
        ids.templateId.toString()
    );
    assert.equal(
        chore.occurrenceDate.toISOString(),
        "2026-09-26T00:00:00.000Z"
    );
    assert.equal(chore.generationType, "normal");
});

test("recurring Chore requires recurringTemplateId, occurrenceDate, and generationType", async () => {
    const chore = baseChore({
        recurringTemplateId: undefined,
        occurrenceDate: undefined,
        generationType: undefined,
    });

    await assert.rejects(
        chore.validate(),
        (error) => {
            assert.ok(error.errors.recurringTemplateId);
            assert.ok(error.errors.occurrenceDate);
            assert.ok(error.errors.generationType);
            return true;
        }
    );
});

test("one-time Chore remains compatible without recurring fields", async () => {
    const chore = baseChore({
        choreType: "one-time",
        recurringTemplateId: undefined,
        occurrenceDate: undefined,
        generationType: undefined,
    });

    await assert.doesNotReject(chore.validate());
});

test("recurring Chore rejects unsupported generation types", async () => {
    const chore = baseChore({
        generationType: "unsupported",
    });

    await assert.rejects(chore.validate(), /generationType/);
});

test("recurring occurrence identity has a unique compound index", () => {
    const indexes = Chore.schema.indexes();

    assert.ok(
        indexes.some(([fields, options]) =>
            fields.recurringTemplateId === 1 &&
            fields.occurrenceDate === 1 &&
            options.unique === true &&
            options.partialFilterExpression?.choreType === "recurring"
        )
    );
});
