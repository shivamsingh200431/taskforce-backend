import express from "express";
import {
    createChore,
    getChores,
    approveChore,
    rejectChore,
    resubmitChore,
    completeChore
} from "../controllers/choreController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createChore);
router.get("/", authMiddleware, getChores);
router.patch("/:id/approve", authMiddleware, approveChore);
router.patch("/:id/reject", authMiddleware, rejectChore);
router.patch("/:id/resubmit", authMiddleware, resubmitChore);
router.patch("/:id/complete", authMiddleware, completeChore);

export default router;
