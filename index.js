const express = require("express");

const cors = require("cors");
const errorHandle = require("./middleware/errorHandeler");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

const connectToMongoDB = require("./db");

app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use(errorHandle);

app.use(
  cors({
    origin: "*",
    "Access-Control-Allow-Origin": "*",
  })
);

app.get("/", (req, res) => {
  return res.json({ message: "Welcome To API" });
});
app.use("/api/auth", require("./routes/auth"));
app.use("/api/post", require("./routes/post"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/message", require("./routes/message"));
app.use("/api/notification", require("./routes/notification"));

connectToMongoDB();

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("setUp", (data) => {
    socket.join(data.userId);
    socket.emit("connected");
  });

  socket.on("join_chat", (chat) => {
    console.log(`User Joined Room ${chat}`);
  });

  socket.on("new_message", (newMessage) => {
    let chat = newMessage.chat;

    if (!chat.users) return console.log("Chat does not have users");

    chat.users.forEach((user) => {
      if (user._id == newMessage.sender._id) {
        return;
      }
      socket.in(user._id).emit("message_received", newMessage);
    });
  });

  socket.on("send_notification", (sender) => {
    console.log(sender);
    socket.emit("create_notification", sender);
  });
});
