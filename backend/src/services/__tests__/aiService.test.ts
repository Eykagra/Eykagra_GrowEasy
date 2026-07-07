import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AiService } from "../aiService.js";

const ENV_BACKUP = { ...process.env };

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.MISTRAL_API_KEY = "test-mistral-key";
  process.env.AI_PRIMARY = "gemini";
});

afterEach(() => {
  process.env = { ...ENV_BACKUP };
});

describe("AiService provider distribution", () => {
  it("round-robins gemini and mistral when both keys are set", () => {
    const svc = new AiService();
    expect(svc.getProviderForBatch(1)).toBe("gemini");
    expect(svc.getProviderForBatch(2)).toBe("mistral");
    expect(svc.getProviderForBatch(3)).toBe("gemini");
    expect(svc.getProviderForBatch(4)).toBe("mistral");
  });

  it("starts with mistral when AI_PRIMARY=mistral", () => {
    process.env.AI_PRIMARY = "mistral";
    const svc = new AiService();
    expect(svc.getProviderForBatch(1)).toBe("mistral");
    expect(svc.getProviderForBatch(2)).toBe("gemini");
  });

  it("uses only gemini when mistral key is missing", () => {
    delete process.env.MISTRAL_API_KEY;
    const svc = new AiService();
    expect(svc.getDistributionProviders()).toEqual(["gemini"]);
    expect(svc.getProviderForBatch(1)).toBe("gemini");
    expect(svc.getProviderForBatch(2)).toBe("gemini");
  });
});