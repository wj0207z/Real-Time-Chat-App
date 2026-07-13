import Room from "../models/Room.js";

const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find()
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        res.json(rooms);
    } catch (error) {
        res.status(500).json({
            message: "Failed to load rooms.",
            error: error.message,
        });
    }
};

const createRoom = async (req, res) => {
    try {
        const { name, description } = req.body || {};

        if (!name) {
            return res.status(400).json({
                message: "Room name is required.",
            });
        }

        const room = await Room.create({
            name,
            description,
            createdBy: req.user._id,
        });

        res.status(201).json({
            message: "Room created successfully.",
            room,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create room.",
            error: error.message,
        });
    }
};

export { createRoom, getRooms };
