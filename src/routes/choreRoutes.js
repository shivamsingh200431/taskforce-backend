const express = require("express");

const {
    createChore,
    getChores,
    approveChore,
    rejectChore,
    completeChore
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

router.patch(
    "/:id/reject",
    authMiddleware,
    rejectChore
);

router.patch(
    "/:id/complete",
    authMiddleware,
    completeChore
);

module.exports = router;