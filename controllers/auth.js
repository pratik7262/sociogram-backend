const User = require("../models/User.js");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { handleErrors, generateOTP } = require("../utils/routerUtils.js");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/email");
const Chat = require("../models/Chat.js");

//Sign Up Function Used To Create New User In SignUp End Point
const signUp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return handleErrors(res, 400, errors.array()[0].msg, false);
    }

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "User with this email already exists. Please enter a unique email.",
      });
    }

    const checkingUsername = await User.findOne({
      username: req.body.username,
    });

    if (checkingUsername) {
      return res.status(400).json({
        success: false,
        message: "The User Name Is Already Taken",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    // const imgURL = req.file ? req.file.path : "uploads\\default.png";
    const OTP = generateOTP();
    const newUser = await User.create({
      name: req.body.name,
      password: hashedPassword,
      email: req.body.email,
      username: req.body.username,
      code: OTP,
    });

    const authToken = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const verificationLink = `${process.env.BASE_URL}/api/auth/verify/${newUser._id}/${authToken}`;

    await sendEmail(
      req.body.email,
      "VERIFY EMAIL",
      `The OTP For Verifying Your Account Is ${OTP}  Or You Can Click The Following Link ${verificationLink}`
    );

    return res.json({
      message:
        "Verification code has been sent to your email. Please verify your account.",
      id: newUser._id,
      success: true,
    });
  } catch (error) {
    return handleErrors(
      res,
      500,
      "Server error occurred. Please try again.",
      false
    );
  }
};

const isUsernameTaken = async (req, res) => {
  try {
    const username = req.params.username;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ isTaken: true });
    } else {
      return res.json({ isTaken: false });
    }
  } catch (error) {
    return handleErrors(
      res,
      500,
      "Server error occurred. Please try again.",
      false
    );
  }
};

//addProfile function used in addprofile route
const addProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image provided" });
    }

    // Save the path of the uploaded image to the user's profile Img
    user.profileImg = req.file.path;
    await user.save();

    return res.json({
      success: true,
      profileImg: user.profileImg,
      message: "Profile image added successfully",
    });
  } catch (error) {
    return handleErrors(res, 500, "Internal server error.", false);
  }
};

//Verify Function Used To Verify User Used In Verification End Point
const verify = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      { verified: true }
    );

    if (!user) {
      return res.status(400).send("Invalid link");
    }

    res.send(
      "<h1>Your email has been verified successfully. Go to the <a href='http://localhost:3000/login'>Login Page</a> to log in.</h1>"
    );
  } catch (error) {
    return handleErrors(
      res,
      500,
      "Server error occurred. Please try again.",
      false
    );
  }
};

const verifyUserByCode = async (req, res) => {
  try {
    const userId = req.params.id; // Get the user ID from req.params
    const { code } = req.body; // Get the code from req.body

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.code === parseInt(code)) {
      user.verified = true;
      user.code = null;
      await user.save();

      const data = {
        user: {
          id: user._id,
        },
      };

      const authToken = jwt.sign(data, process.env.JWT_SECRET);
      const { _id: userId } = user;
      const { username, profileImg } = user;
      return res.json({
        success: true,
        authToken,
        userId,
        username,
        profileImg,
        message: "Account verified successfully",
      });
    } else {
      return res.json({ success: false, message: "Invalid code" });
    }
  } catch (error) {
    return handleErrors(res, 500, "Internal server error.", false);
  }
};

//Sign In Function Used In Login End Point
const signIn = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return handleErrors(res, 400, errors.array()[0].msg, false);
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return handleErrors(res, 400, "Please enter valid credentials.", false);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return handleErrors(res, 400, "Please enter valid credentials.", false);
    }

    const data = {
      user: {
        id: user._id,
      },
    };

    const authToken = jwt.sign(data, process.env.JWT_SECRET);
    const { _id: userId, verified, username, profileImg } = user;

    res.json({
      success: true,
      authToken,
      verified,
      userId,
      username,
      profileImg,
    });
  } catch (error) {
    return handleErrors(
      res,
      500,
      "Server error occurred. Please try again.",
      false
    );
  }
};

//Fetch User Function
const fetchUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    return handleErrors(
      res,
      500,
      "Server error occurred. Please try again.",
      false
    );
  }
};

const checkUserExists = async (req, res) => {
  try {
    const { username } = req.params; // Assuming you're checking by username

    // Check if the user exists in the database
    const user = await User.findOne({ username });

    if (user) {
      // User exists
      return res.json({ exists: true });
    } else {
      // User does not exist
      return res.json({
        exists: false,
      });
    }
  } catch (error) {
    console.error(error);
    return handleErrors(res, 500, "Internal server error");
  }
};

const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params; // Assuming you pass the username as a route parameter

    // Find the user by username in the database
    const user = await User.findOne({ username });

    if (!user) {
      // If user is not found, respond with a 404 status code and a message
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // If user is found, respond with the user object
    return res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    return handleErrors(res, 500, "Internal server error");
  }
};

const follow = async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.id;

  try {
    // Update the follower's following list
    const follower = await User.findByIdAndUpdate(followerId, {
      $addToSet: { following: userId },
    });

    await follower.save();

    // Update the user's followers list
    const user = await User.findByIdAndUpdate(userId, {
      $addToSet: { followers: followerId },
    });

    await user.save();

    return res.json({
      success: true,
      message: `You are now following ${user.username}.`,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const unfollow = async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.id; // Assuming you have a way to identify the follower

  try {
    // Remove the user from the follower's following list
    await User.findByIdAndUpdate(followerId, { $pull: { following: userId } });

    // Remove the follower from the user's followers list
    const user = await User.findByIdAndUpdate(userId, {
      $pull: { followers: followerId },
    });

    return res.json({
      success: true,
      message: `You have unfollowed ${user.username}.`,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const getUserInfo = async (req, res) => {
  const userId = req.params.userId; // Get the userId from route parameters

  try {
    // Find the user by userId
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Get the user's profileImg URL
    const profileImg = user.profileImg;
    const username = user.username;
    const name = user.name;

    return res.json({ profileImg, username, name });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const findUsers = async (req, res) => {
  try {
    const searchQuery = req.body.searchQuery;
    const userId = req.params.userId;

    // Perform a case-insensitive search for users whose name or username partially matches the input
    if (searchQuery === "") {
      return res.json({ success: true, users: [] });
    }

    const users = await User.find(
      {
        _id: { $ne: userId },
        $or: [
          { name: { $regex: new RegExp(searchQuery, "i") } },
          { username: { $regex: new RegExp(searchQuery, "i") } },
        ],
      },
      "_id name username profileImg" // Include _id, name, and username fields in the result
    );

    return res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const findChat = async (req, res) => {
  try {
    const userId = req.params.userId; // Assuming you can get the userId from req.params
    const searchQuery = req.query.search;

    // Perform a case-insensitive search for users whose name or username partially matches the input
    if (searchQuery === "") {
      return res.json({ success: true, users: [] });
    }

    // Find users whose followers array contains the specified userId
    const users = await User.find(
      {
        _id: { $ne: userId }, // Exclude the requesting user from the results
        followers: userId, // Check if userId is in the followers array
        $or: [
          { name: { $regex: new RegExp(searchQuery, "i") } },
          { username: { $regex: new RegExp(searchQuery, "i") } },
        ],
      },
      "_id name username profileImg"
    );

    return res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const getFollowings = async (req, res) => {
  try {
    // Get the user ID of the logged-in user
    const userId = req.user.id;

    // Find the user based on the user ID
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Retrieve the followings (users they are following)
    const followings = await User.find(
      { _id: { $in: user.following } },
      "_id username profileImg"
    );

    return res.json({ success: true, followings });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  signUp,
  verify,
  verifyUserByCode,
  signIn,
  fetchUser,
  getUserByUsername,
  addProfile,
  isUsernameTaken,
  checkUserExists,
  follow,
  unfollow,
  getUserInfo,
  findUsers,
  findChat,
  getFollowings,
};
