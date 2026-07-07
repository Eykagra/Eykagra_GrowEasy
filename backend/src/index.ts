import "dotenv/config";
import express from "express";
import cors from "cors";
import importRouter from "./routes/import.js";
import healthRouter from "./routes/health.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "4000", 10);
const HOST = process.env.HOST ?? "0.0.0.0";

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;

  const allowed = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowed.includes("*") || allowed.includes(origin)) return true;

  // Vercel preview & production deployments
  if (/^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) return true;

  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin));
    },
    methods: ["GET", "POST", "OPTIONS"],
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    service: "GrowEasy CSV Importer API",
    health: "/health",
    import: "/api/import",
  });
});

app.use("/health", healthRouter);
app.use("/api/health", healthRouter);
app.use("/api/import", importRouter);

app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`CSV Importer API running on http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
});