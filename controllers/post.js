const io = require("../index");
const Post = require("../models/Post");
const User = require("../models/User");

const handleErrors = (res, statusCode, message) => {
  return res.status(statusCode).json({ success: false, message });
};

const addPost = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return handleErrors(res, 404, "User not found");
    }

    const { content } = req.body;

    let imageUrl = req.file.path;

    const newPost = await Post.create({
      user: userId,
      content,
      imageUrl,
    });

    return res.json({
      success: true,
      message: "Post added successfully",
    });
  } catch (error) {
    console.error(error);
    return handleErrors(res, 500, "Internal server error");
  }
};

const getSpecificPosts = async (req, res) => {
  try {
    const { username } = req.params;

    const userInfo = await User.findOne({ username });
    const user = userInfo._id;
    // Fetch user-specific posts using the Post model
    const userPosts = await Post.find({ user }).sort({ createdAt: -1 });

    return res.json({ success: true, userPosts });
  } catch (error) {
    console.error(error);
    return handleErrors(res, 500, "Internal server error");
  }
};

const getAllPosts = async (req, res) => {
  try {
    const allPosts = await Post.find().sort({ createdAt: -1 });

    return res.json({ success: true, allPosts });
  } catch (error) {
    console.error(error);
    return handleErrors(res, 500, "Internal server error");
  }
};

const like = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    // Check if the post with the given ID exists
    const post = await Post.findById(postId);
    if (!post) {
      return handleErrors(res, 404, "Post not found");
    }

    // Check if the user has already liked the post
    const userIndex = post.likes.indexOf(userId);
    if (userIndex !== -1) {
      // User has already liked the post, so remove the user's ID from the likes array
      post.likes.splice(userIndex, 1);
      await post.save();

      return res.json({
        success: true,
        likes: post.likes.length,
        isLiked: false,
      });
    }

    // User has not liked the post, so add the user's ID to the likes array
    post.likes.push(userId);
    await post.save();

    return res.json({ success: true, likes: post.likes.length, isLiked: true });
  } catch (error) {
    console.error(error);
    return handleErrors(res, 500, "Internal server error");
  }
};

const addCommentToPost = async (req, res) => {
  try {
    const postId = req.params.postId; // Get the post ID from req.params
    const user = req.user.id; // Get the user ID from req.user (assuming user is authenticated)
    const { text } = req.body; // Get the comment text from req.body

    // Check if the post with the given ID exists
    if (text === "") {
      return res.json({
        success: false,
        message: "comment Should Not Be Empty. Please Write Something",
      });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return handleErrors(res, 404, "Post not found");
    }

    // Create a new comment object with the user's ID and text
    const comment = {
      user,
      text,
    };

    // Add the comment to the post's comments array
    post.comments.push(comment);
    await post.save();

    return res.json({
      success: true,
      message: "Comment added successfully",
      comments: post.comments,
    });
  } catch (error) {
    console.error(error);
    return handleErrors(res, 500, "Internal server error");
  }
};

const getAllCommentsForPost = async (req, res) => {
  try {
    const postId = req.params.postId; // Get the post ID from req.params

    // Check if the post with the given ID exists
    const post = await Post.findById(postId);
    if (!post) {
      return handleErrors(res, 404, "Post not found");
    }

    // Retrieve all comments for the post
    const comments = post.comments;

    return res.json({ comments });
  } catch (error) {
    console.error(error);
    return handleErrors(res, 500, "Internal server error");
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.postId; // Get the post ID from req.params

    // Fetch the post by ID
    const post = await Post.findById(postId);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    return res.json({ success: true, post });
  } catch (error) {
    console.error(error);
    return handleErrors(res, 500, "Internal server error");
  }
};

const changeProfileImg = async (req, res) => {
  const { userId } = req.params; // Get userId and newProfileImgUrl from route params
  const { newProfileImgUrl } = req.body;

  try {
    // Update the user's profileImg in their posts
    await Post.updateMany(
      { user: userId },
      { $set: { profileImg: newProfileImgUrl } }
    );

    // Update the user's profileImg in their comments
    await Post.updateMany(
      { "comments.user": userId },
      { $set: { "comments.$[elem].profileImg": newProfileImgUrl } },
      { arrayFilters: [{ "elem.user": userId }] }
    );

    return res.json({
      success: true,
      message: "Profile image updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  addPost,
  getSpecificPosts,
  getAllPosts,
  getPost,
  like,
  addCommentToPost,
  getAllCommentsForPost,
  changeProfileImg,
};
