const express = require("express");
const {
  addPost,
  getSpecificPosts,
  getAllPosts,
  like,
  addCommentToPost,
  getAllCommentsForPost,
  getPost,
  changeProfileImg,
} = require("../controllers/post");
const router = express.Router();
const getUser = require("../middleware/fetchUser");
const upload = require("../middleware/upload");
require("dotenv").config();

router.post("/addpost", [getUser, upload.single("img")], addPost);

router.get("/getspecificposts/:username", getSpecificPosts);

router.get("/getallposts", getAllPosts);

router.get("/like/:postId", getUser, like);

router.post("/addcomment/:postId", getUser, addCommentToPost);

router.get("/getcomments/:postId", getAllCommentsForPost);

router.get("/getpost/:postId", getPost);

router.post("/changeprofileimg/:userId", changeProfileImg);

module.exports = router;
