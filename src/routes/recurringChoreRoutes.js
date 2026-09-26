const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const {
    createRecurringChore,
    listRecurringChores,
    getRecurringChore,
    updateRecurringChore,
    deleteRecurringChore,
    generateRecurringChoreManually
} = require("../controllers/recurringChoreController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createRecurringChore);
router.get("/", listRecurringChores);
router.get("/:id", getRecurringChore);
router.patch("/:id", updateRecurringChore);
router.delete("/:id", deleteRecurringChore);
router.post("/:id/generate", generateRecurringChoreManually);

module.exports = router;
