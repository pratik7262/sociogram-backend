const Notification = require("../models/Notification");
const { handleErrors } = require("../utils/routerUtils");

const createNotification = async (req, res) => {
  try {
    const { user, createdBy, message } = req.body;
    const notification = await Notification.create({
      user,
      createdBy,
      message,
    });

    // Populate the createdBy field after creating the notification
    await notification.populate("createdBy", "username profileImg _id");

    res.json({ notification });
  } catch (error) {
    return handleErrors(res, 500, "Internal server error");
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.params.userId,
    }).populate("createdBy", "_id username profileImg");

    res.json({ notifications });
  } catch (error) {
    return handleErrors(res, 500, "Internal server error");
  }
};

module.exports = { createNotification, getNotifications };
