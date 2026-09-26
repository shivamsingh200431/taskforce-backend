import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    createRecurringChore,
    listRecurringChores,
    getRecurringChore,
    updateRecurringChore,
    deleteRecurringChore,
    generateRecurringChoreManually
} from "../controllers/recurringChoreController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createRecurringChore);
router.get("/", listRecurringChores);
router.get("/:id", getRecurringChore);
router.patch("/:id", updateRecurringChore);
router.delete("/:id", deleteRecurringChore);
router.post("/:id/generate", generateRecurringChoreManually);

export default router;
