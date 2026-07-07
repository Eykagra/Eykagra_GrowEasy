import { buildUserPrompt, SYSTEM_PROMPT } from "../../prompts/extraction.js";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const FALLBACK_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

interface GeminiErrorBody {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

export async function callGemini(
  apiKey: string,
  model: string,
  batch: { rowIndex: number; data: Record<string, string> }[]
): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error("GEMINI_API_KEY is empty");
  }

  const modelsToTry = [model, ...FALLBACK_MODELS.filter((m) => m !== model)];
  let lastError: Error | null = null;

  for (const currentModel of modelsToTry) {
    try {
      return await callGeminiModel(apiKey, currentModel, batch);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const retryable = isModelFallbackError(lastError);
      if (!retryable) throw lastError;
      console.warn(`Gemini model ${currentModel} failed: ${lastError.message}. Trying next model...`);
    }
  }

  throw lastError ?? new Error("Gemini extraction failed");
}

async function callGeminiModel(
  apiKey: string,
  model: string,
  batch: { rowIndex: number; data: Record<string, string> }[]
): Promise<string> {
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: buildUserPrompt(batch) }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  const raw = await response.text();
  let parsed: GeminiErrorBody & {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  } = {};

  try {
    parsed = JSON.parse(raw);
  } catch {
    // non-JSON body
  }

  if (!response.ok) {
    const apiMessage = parsed.error?.message ?? raw.slice(0, 300) ?? "Unknown error";
    const code = parsed.error?.code ?? response.status;
    throw new Error(`Gemini API error (${code}): ${apiMessage}`);
  }

  const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error("Empty response from Gemini");
  }

  return content;
}

function isModelFallbackError(err: Error): boolean {
  const msg = err.message.toLowerCase();
  return (
    msg.includes("403") ||
    msg.includes("permission_denied") ||
    msg.includes("denied access") ||
    msg.includes("404") ||
    msg.includes("not found")
  );
}