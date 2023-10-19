const express = require("express");
const { sendMessage, getMessages } = require("../controllers/message");
const router = express.Router();
const getUser = require("../middleware/fetchUser");

router.post("/sendmessage", getUser, sendMessage);

router.get("/getmessages/:chatId", getUser, getMessages);

module.exports = router;
