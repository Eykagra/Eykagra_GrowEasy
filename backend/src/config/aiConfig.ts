export type AiPrimary = "gemini" | "mistral";

export interface AiConfig {
  geminiApiKey: string;
  mistralApiKey: string;
  geminiModel: string;
  mistralModel: string;
  maxRetries: number;
  primary: AiPrimary;
}

function isPlaceholderKey(key: string | undefined): boolean {
  if (!key) return true;
  const lower = key.toLowerCase();
  return (
    lower.includes("your_") ||
    lower.includes("paste") ||
    lower.includes("here") ||
    lower === "sk-xxx"
  );
}

export function getAiConfig(): AiConfig {
  const geminiRaw = process.env.GEMINI_API_KEY?.trim();
  const mistralRaw = process.env.MISTRAL_API_KEY?.trim();
  const geminiApiKey = isPlaceholderKey(geminiRaw) ? undefined : geminiRaw;
  const mistralApiKey = isPlaceholderKey(mistralRaw) ? undefined : mistralRaw;

  if (!geminiApiKey && !mistralApiKey) {
    throw new Error(
      "At least one API key is required. Set GEMINI_API_KEY and/or MISTRAL_API_KEY in backend/.env"
    );
  }

  const primary: AiPrimary =
    process.env.AI_PRIMARY === "mistral" && mistralApiKey
      ? "mistral"
      : process.env.AI_PRIMARY === "gemini" && geminiApiKey
        ? "gemini"
        : mistralApiKey && !geminiApiKey
          ? "mistral"
          : "gemini";

  if (!geminiApiKey) {
    console.warn("GEMINI_API_KEY not set — using Mistral only");
  }

  if (!mistralApiKey) {
    console.warn(
      "MISTRAL_API_KEY not set — no fallback when Gemini is rate-limited. Add it to backend/.env"
    );
  }

  return {
    geminiApiKey: geminiApiKey ?? "",
    mistralApiKey: mistralApiKey ?? "",
    geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    mistralModel: process.env.MISTRAL_MODEL ?? "mistral-small-latest",
    maxRetries: parseInt(process.env.MAX_RETRIES ?? "3", 10),
    primary,
  };
}