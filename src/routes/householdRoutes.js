const express = require("express");

const {
    createHousehold,
    joinHousehold
} = require("../controllers/householdController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createHousehold);

router.post("/join", authMiddleware, joinHousehold);

module.exports = router;