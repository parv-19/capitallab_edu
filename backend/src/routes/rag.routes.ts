import { Router } from "express";

import {
  deleteConversation,
  deleteRagDocument,
  getConversation,
  getRagOptions,
  listConversations,
  listRagDocuments,
  listRagLogs,
  listRagUnanswered,
  processRagDocument,
  ragChatStream,
  ragChat,
  reindexRagDocument,
  regenerateMessage,
  submitMessageFeedback,
  uploadRagDocument,
} from "../controllers/rag.controller";
import { adminOnly, authMiddleware } from "../middleware/auth.middleware";
import { uploadDocument } from "../middleware/upload.middleware";

const router = Router();

router.get("/options", authMiddleware, getRagOptions);
router.post("/chat", authMiddleware, ragChat);
router.post("/chat/stream", authMiddleware, ragChatStream);
router.get("/conversations", authMiddleware, listConversations);
router.get("/conversations/:id", authMiddleware, getConversation);
router.delete("/conversations/:id", authMiddleware, deleteConversation);
router.post("/messages/:id/feedback", authMiddleware, submitMessageFeedback);
router.post("/messages/:id/regenerate", authMiddleware, regenerateMessage);

router.post("/upload", authMiddleware, adminOnly, uploadDocument, uploadRagDocument);
router.get("/documents", authMiddleware, adminOnly, listRagDocuments);
router.post("/documents/:id/process", authMiddleware, adminOnly, processRagDocument);
router.post("/documents/:id/reindex", authMiddleware, adminOnly, reindexRagDocument);
router.delete("/documents/:id", authMiddleware, adminOnly, deleteRagDocument);
router.get("/logs", authMiddleware, adminOnly, listRagLogs);
router.get("/unanswered", authMiddleware, adminOnly, listRagUnanswered);

export default router;
