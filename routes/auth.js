const express = require("express");
const router = express.Router();
const getUser = require("../middleware/fetchUser");
const { signUpRules, signInRules } = require("../utils/routerUtils");
const {
  signUp,
  verify,
  signIn,
  fetchUser,
  getUserByUsername,
  addProfile,
  isUsernameTaken,
  verifyUserByCode,
  checkUserExists,
  follow,
  unfollow,
  getUserInfo,
  findUsers,
  findChat,
  getFollowings,
} = require("../controllers/auth.js");
const upload = require("../middleware/upload");
require("dotenv").config();

router.post("/signup", signUpRules, signUp);

router.post("/addprofile/", [getUser, upload.single("img")], addProfile);

router.get("/verify/:id/:token", verify);

router.post("/verify/:id/", verifyUserByCode);

router.post("/signin", signInRules, signIn);

router.get("/fetchuser", getUser, fetchUser);

router.get("/istaken/:username", isUsernameTaken);

router.get("/isuserexists/:username", checkUserExists);

router.get("/getuser/:username", getUserByUsername);

router.get("/follow/:userId", getUser, follow);

router.delete("/unfollow/:userId", getUser, unfollow);

router.get("/getuserinfo/:userId", getUserInfo);

router.post("/finduser/:userId", findUsers);

router.get("/findchat/:userId", findChat);

router.get("/getfollowings", getUser, getFollowings);

module.exports = router;
