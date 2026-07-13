import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";

dotenv.config();

connectDB();

const app = express();

const server = http.createServer(app);

//create Socket.io server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Real-Time Chat API is running",
    });
});

//listens for a browser/client connecting
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    //lets the user join a specific chat room
    //backend will leave old room and join new room
    socket.on("join_room", ({ roomId, previousRoomId }) => {
    if (previousRoomId) {
        socket.leave(previousRoomId);
        console.log(`User ${socket.id} left room ${previousRoomId}`);
    }

    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    });

    //broadcasts the message to all users in the room
    socket.on("send_message", (message) => {
        io.to(message.room._id).emit("receive_message", message);
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5001;

//use server.listen instead of app.listen to allow socket.io to work
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});