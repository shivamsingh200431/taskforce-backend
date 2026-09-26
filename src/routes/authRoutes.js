import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { registerUser, loginUser } from "../controllers/authController.js";
import loginLimiter from "../middleware/loginLimiter.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);
router.get("/profile", authMiddleware, (req, res) => {
    res.json({
        message: "Protected route accessed",
        user: req.user
    });
});

export default router;
