const express = require("express");

const {
    createChore
} = require("../controllers/choreController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    createChore
);

module.exports = router;