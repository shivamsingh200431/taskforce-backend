const express = require("express");

const {
    createChore,
    getChores,
    approveChore
} = require("../controllers/choreController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    createChore
);

router.get(
    "/",
    authMiddleware,
    getChores
);

router.patch(
    "/:id/approve",
    authMiddleware,
    approveChore
);

module.exports = router;