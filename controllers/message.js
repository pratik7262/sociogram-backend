const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");
const { handleErrors } = require("../utils/routerUtils");

const sendMessage = async (req, res) => {
  try {
    const sender = req.user.id;
    const { content, chat } = req.body;

    let message = await Message.create({ sender, content, chat });

    message = await message.populate("sender", "username");
    message = await message.populate("chat");

    message = await User.populate(message, {
      path: "chat.users",
      select: "username",
    });

    await Chat.findByIdAndUpdate(chat, {
      latestMessage: message,
    });

    res.status(200).json({ message });
  } catch (error) {
    return handleErrors(res, 500, "Internal server error");
  }
};

const getMessages = async (req, res) => {
  try {
    const senderId = req.user.id;
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username")
      .populate("chat");

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.json({ success: false });
    }

    // Filter out the receiver's _id from the chat users array
    const receiverId = chat.users.find(
      (userId) => userId.toString() !== senderId
    );

    const receiver = await User.findOne(
      { _id: receiverId },
      "_id name username profileImg"
    );
    return res.json({ success: true, messages, receiver });
  } catch (error) {
    return handleErrors(res, 500, "Internal server error");
  }
};

module.exports = { sendMessage, getMessages };
