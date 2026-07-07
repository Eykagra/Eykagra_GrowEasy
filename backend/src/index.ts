import "dotenv/config";
import app from "./app.js";

// Vercel Express Services: export the app (no manual listen on Vercel)
export default app;

if (!process.env.VERCEL) {
  const PORT = parseInt(process.env.PORT ?? "4000", 10);
  const HOST = process.env.HOST ?? "0.0.0.0";

  app.listen(PORT, HOST, () => {
    console.log(`CSV Importer API running on http://${HOST}:${PORT}`);
    console.log(`Health check: http://${HOST}:${PORT}/health`);
  });
}