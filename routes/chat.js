const express = require("express");
const { createChat, getChats } = require("../controllers/chat");
const router = express.Router();
const getUser = require("../middleware/fetchUser");

router.post("/createchat/", getUser, createChat);

router.get("/getchats", getUser, getChats);

module.exports = router;
