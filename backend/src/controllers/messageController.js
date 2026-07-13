import Message from "../models/Message.js";
import Room from "../models/Room.js";

const getMessagesByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        const messages = await Message.find({ room: roomId })
            .populate("sender", "name email")
            .populate("room", "name")
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({
            message: "Failed to load messages.",
            error: error.message,
        });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { roomId, content } = req.body;

        if (!roomId || !content) {
            return res.status(400).json({
                message: "Room and message content are required.",
            });
        }

        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({
                message: "Room not found.",
            });
        }

        const message = await Message.create({
            sender: req.user._id,
            room: roomId,
            content,
        });

        const fullMessage = await Message.findById(message._id)
            .populate("sender", "name email")
            .populate("room", "name");

        res.status(201).json({
            message: "Message sent successfully.",
            data: fullMessage,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to send message.",
            error: error.message,
        });
    }
};

export { getMessagesByRoom, sendMessage };
