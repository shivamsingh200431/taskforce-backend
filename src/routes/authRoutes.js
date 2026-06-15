const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");



const {
    registerUser,
    loginUser
} = require("../controllers/authController");

const loginLimiter = require("../middleware/loginLimiter");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginLimiter, loginUser);

router.get("/profile", authMiddleware, (req, res) => {
    res.json({
        message: "Protected route accessed",
        user: req.user
    });
});

module.exports = router;