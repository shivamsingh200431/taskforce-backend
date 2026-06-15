const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        message: "Too many login attempts. Please try again in 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = loginLimiter;