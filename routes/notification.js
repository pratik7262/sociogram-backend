const express = require("express");
const {
  createNotification,
  getNotifications,
} = require("../controllers/notification");
const router = express.Router();
const getUser = require("../middleware/fetchUser");

router.post("/", createNotification);

router.get("/:userId", getNotifications);

module.exports = router;
