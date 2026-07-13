import express from "express";
import {
    getMessagesByRoom,
    sendMessage,
} from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/room/:roomId", protect, getMessagesByRoom);
router.post("/", protect, sendMessage);

export default router;