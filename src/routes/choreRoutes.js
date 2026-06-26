const express = require("express");

const {
    createChore,
    getChores,
    approveChore,
    rejectChore
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
)

module.exports = router;