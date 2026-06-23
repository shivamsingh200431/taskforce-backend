const express = require("express");

const {
    createHousehold,
    joinHousehold,
    getMyHouseholds
} = require("../controllers/householdController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createHousehold);

router.post("/join", authMiddleware, joinHousehold);

router.get("/me", authMiddleware, getMyHouseholds);

module.exports = router;