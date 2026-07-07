import { getAiConfig } from "../config/aiConfig.js";
import { parseExtractionResponse, type BatchExtractionResult } from "./extractionParser.js";
import { callGemini } from "./providers/geminiProvider.js";
import { callMistral } from "./providers/mistralProvider.js";

type ProviderName = "gemini" | "mistral";

export class AiService {
  private config: ReturnType<typeof getAiConfig>;

  constructor() {
    this.config = getAiConfig();
    const dist = this.getDistributionProviders();
    if (dist.length > 1) {
      console.log(
        `AI load balancing: round-robin across ${dist.join(" + ")} (fallback enabled)`
      );
    } else {
      console.log(`AI provider: ${dist[0] ?? "none"}`);
    }
  }

  async extractBatch(
    batch: { rowIndex: number; data: Record<string, string> }[],
    options?: { batchNumber?: number }
  ): Promise<BatchExtractionResult> {
    const providers =
      options?.batchNumber !== undefined
        ? this.getProviderOrderForBatch(options.batchNumber)
        : this.getProviderOrder();

    if (providers.length === 0) {
      throw new Error("No AI providers configured");
    }

    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        return await this.extractWithProvider(provider, batch);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const next = providers.indexOf(provider) + 1;

        console.error(`[${provider}] ${lastError.message}`);

        if (next < providers.length) {
          console.warn(`Falling back to ${providers[next]}...`);
          continue;
        }
      }
    }

    const hint = buildErrorHint(providers, lastError, this.config);

    throw new Error(`${lastError?.message ?? "Unknown error"}${hint}`);
  }

  getDistributionProviders(): ProviderName[] {
    const available: ProviderName[] = [];
    if (this.config.geminiApiKey) available.push("gemini");
    if (this.config.mistralApiKey) available.push("mistral");

    if (available.length <= 1) return available;

    const order: ProviderName[] =
      this.config.primary === "mistral"
        ? ["mistral", "gemini"]
        : ["gemini", "mistral"];

    return order.filter((p) => available.includes(p));
  }

  getProviderForBatch(batchNumber: number): ProviderName {
    const dist = this.getDistributionProviders();
    if (dist.length === 0) {
      throw new Error("No AI providers configured");
    }
    return dist[(batchNumber - 1) % dist.length];
  }

  private getProviderOrder(): ProviderName[] {
    return this.getDistributionProviders();
  }

  private getProviderOrderForBatch(batchNumber: number): ProviderName[] {
    const dist = this.getDistributionProviders();
    if (dist.length <= 1) return dist;

    const preferred = this.getProviderForBatch(batchNumber);
    return [preferred, ...dist.filter((p) => p !== preferred)];
  }

  private async extractWithProvider(
    provider: ProviderName,
    batch: { rowIndex: number; data: Record<string, string> }[]
  ): Promise<BatchExtractionResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const content = await this.callProvider(provider, batch);
        return parseExtractionResponse(content, batch);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (isQuotaExhausted(lastError)) {
          throw lastError;
        }

        if (
          attempt < this.config.maxRetries &&
          (isTransientError(lastError) || isParseError(lastError))
        ) {
          const delay = getRetryDelay(lastError, attempt);
          await sleep(delay);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError ?? new Error(`${provider} extraction failed`);
  }

  private async callProvider(
    provider: ProviderName,
    batch: { rowIndex: number; data: Record<string, string> }[]
  ): Promise<string> {
    if (provider === "gemini") {
      return callGemini(this.config.geminiApiKey, this.config.geminiModel, batch);
    }
    return callMistral(this.config.mistralApiKey, this.config.mistralModel, batch);
  }
}

function isQuotaExhausted(err: Error): boolean {
  const msg = err.message.toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource_exhausted") ||
    msg.includes("too many requests")
  );
}

function isParseError(err: Error): boolean {
  const msg = err.message.toLowerCase();
  return msg.includes("invalid json") || msg.includes("json at position");
}

function isTransientError(err: Error): boolean {
  const msg = err.message.toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("overloaded") ||
    msg.includes("timeout") ||
    msg.includes("500")
  );
}

function getRetryDelay(err: Error, attempt: number): number {
  const match = err.message.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000);
  }
  return Math.pow(2, attempt) * 500;
}

function buildErrorHint(
  providers: ProviderName[],
  err: Error | null,
  config: ReturnType<typeof getAiConfig>
): string {
  const msg = err?.message ?? "";

  if (isQuotaExhausted(err ?? new Error(msg))) {
    return " Gemini free-tier quota is exhausted. Wait and retry, enable billing, or use Mistral as primary (AI_PRIMARY=mistral).";
  }

  if (msg.includes("denied access") || msg.includes("403")) {
    return " This Gemini model is denied for your Google project. Try a new API key, enable billing, or set AI_PRIMARY=mistral.";
  }

  if (isParseError(err ?? new Error(msg))) {
    return config.mistralApiKey
      ? " Gemini returned malformed JSON. Retries and Mistral fallback were attempted."
      : " Gemini returned malformed JSON. Add MISTRAL_API_KEY for automatic fallback.";
  }

  if (providers.length === 1 && providers[0] === "gemini" && !config.mistralApiKey) {
    return " Add MISTRAL_API_KEY to backend/.env for automatic fallback.";
  }

  return "";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}