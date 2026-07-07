import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { parseCsv } from "../services/csvService.js";
import { AiService } from "../services/aiService.js";
import { BatchProcessor } from "../services/batchProcessor.js";
import { AppError } from "../middleware/errorHandler.js";
import type { StreamEvent } from "../types/crm.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(new AppError("Only CSV files are allowed"));
    }
  },
});

const router = Router();

function getProcessor(): BatchProcessor {
  return new BatchProcessor(new AiService());
}

router.post(
  "/",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError("No CSV file uploaded");
      }

      const { records } = parseCsv(req.file.buffer);
      const processor = getProcessor();
      const result = await processor.process(records);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/stream",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError("No CSV file uploaded");
      }

      const { records } = parseCsv(req.file.buffer);
      const processor = getProcessor();

      res.setHeader("Content-Type", "application/x-ndjson");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const writeEvent = (event: StreamEvent) => {
        res.write(JSON.stringify(event) + "\n");
      };

      const result = await processor.process(records, (progress) => {
        writeEvent(progress);
      });

      writeEvent({ type: "complete", data: result });
      res.end();
    } catch (err) {
      if (!res.headersSent) {
        next(err);
      } else {
        const message = err instanceof Error ? err.message : "Processing failed";
        res.write(JSON.stringify({ type: "error", message }) + "\n");
        res.end();
      }
    }
  }
);

export default router;