import express from "express";
import {
    createHousehold,
    joinHousehold,
    getMyHouseholds
} from "../controllers/householdController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createHousehold);
router.post("/join", authMiddleware, joinHousehold);
router.get("/me", authMiddleware, getMyHouseholds);

export default router;
