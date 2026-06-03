import { Router } from "express";

import {
  deleteConversation,
  getConversation,
  listConversations,
  ragChat,
  ragChatStream,
  regenerateMessage,
  submitMessageFeedback,
} from "../controllers/rag.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/chat", authMiddleware, ragChat);
router.post("/chat/stream", authMiddleware, ragChatStream);
router.get("/conversations", authMiddleware, listConversations);
router.get("/conversations/:id", authMiddleware, getConversation);
router.delete("/conversations/:id", authMiddleware, deleteConversation);
router.post("/messages/:id/feedback", authMiddleware, submitMessageFeedback);
router.post("/messages/:id/regenerate", authMiddleware, regenerateMessage);

export default router;
