import { Router } from "express";

import {
  deleteRagDocument,
  getRagOptions,
  listRagDocuments,
  listRagLogs,
  listRagUnanswered,
  processRagDocument,
  ragChat,
  reindexRagDocument,
  uploadRagDocument,
} from "../controllers/rag.controller";
import { adminOnly, authMiddleware } from "../middleware/auth.middleware";
import { uploadDocument } from "../middleware/upload.middleware";

const router = Router();

router.get("/options", authMiddleware, getRagOptions);
router.post("/chat", authMiddleware, ragChat);

router.post("/upload", authMiddleware, adminOnly, uploadDocument, uploadRagDocument);
router.get("/documents", authMiddleware, adminOnly, listRagDocuments);
router.post("/documents/:id/process", authMiddleware, adminOnly, processRagDocument);
router.post("/documents/:id/reindex", authMiddleware, adminOnly, reindexRagDocument);
router.delete("/documents/:id", authMiddleware, adminOnly, deleteRagDocument);
router.get("/logs", authMiddleware, adminOnly, listRagLogs);
router.get("/unanswered", authMiddleware, adminOnly, listRagUnanswered);

export default router;
