import { describe, it, expect } from "vitest";
import { parseAiJson } from "../jsonParse.js";

describe("parseAiJson", () => {
  it("parses clean JSON", () => {
    const result = parseAiJson<{ ok: boolean }>('{"ok":true}');
    expect(result.ok).toBe(true);
  });

  it("extracts JSON from markdown fences", () => {
    const result = parseAiJson<{ records: unknown[] }>(
      'Here is data:\n```json\n{"records":[]}\n```'
    );
    expect(result.records).toEqual([]);
  });

  it("repairs trailing commas", () => {
    const result = parseAiJson<{ a: number }>('{"a":1,}');
    expect(result.a).toBe(1);
  });
});