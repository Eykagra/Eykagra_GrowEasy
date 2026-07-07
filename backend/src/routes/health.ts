import { Router, type Request, type Response } from "express";
import { getAiConfig } from "../config/aiConfig.js";

const router = Router();
const startedAt = Date.now();

router.get("/", (_req: Request, res: Response) => {
  let providers = { gemini: false, mistral: false };

  try {
    const config = getAiConfig();
    providers = {
      gemini: Boolean(config.geminiApiKey),
      mistral: Boolean(config.mistralApiKey),
    };
  } catch {
    // keys not configured — still report API is up
  }

  res.status(200).json({
    status: "ok",
    service: "growseasy-csv-importer-api",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    startedAt: new Date(startedAt).toISOString(),
    providers,
  });
});

export default router;