const Chat = require("../models/Chat");
const User = require("../models/User");
const { handleErrors } = require("../utils/routerUtils");

const createChat = async (req, res) => {
  try {
    const userId = req.body.userId;

    let chat = await Chat.find({
      $and: [
        { users: { $elemMatch: { $eq: req.user.id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("users", "_id name username profileImg")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "_id name username profileImg" },
      });

    if (chat.length > 0) {
      return res.status(200).json({ chat, new: false });
    } else {
      const newChat = await Chat.create({
        users: [req.user.id, userId],
      });

      // Populate only the fields you need for the response
      const fullChat = await Chat.findOne({ _id: newChat._id }).populate(
        "users",
        "_id name username profileImg"
      );

      return res.status(200).json({ chat: fullChat, new: true });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const getChats = async (req, res) => {
  try {
    const user = req.user.id;

    let chats = Chat.find({ users: { $elemMatch: { $eq: user } } })
      .populate("users", "_id name username profileImg")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: "latestMessage",
      populate: { path: "sender", select: "username" },
    });

    return res.status(200).json({ chats });
  } catch (error) {
    return handleErrors(res, 500, "Internal server error");
  }
};
module.exports = { createChat, getChats };
