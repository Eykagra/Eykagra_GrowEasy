import { describe, it, expect } from "vitest";
import { parseCsv } from "../csvService.js";

describe("parseCsv", () => {
  it("parses a valid CSV with headers", () => {
    const csv = Buffer.from(
      "name,email,phone\nJohn,john@test.com,1234567890\nJane,jane@test.com,0987654321"
    );
    const result = parseCsv(csv);

    expect(result.headers).toEqual(["name", "email", "phone"]);
    expect(result.records).toHaveLength(2);
    expect(result.records[0].name).toBe("John");
    expect(result.records[1].email).toBe("jane@test.com");
  });

  it("throws on empty CSV", () => {
    const csv = Buffer.from("");
    expect(() => parseCsv(csv)).toThrow();
  });

  it("trims header and cell whitespace", () => {
    const csv = Buffer.from(" name , email \n John , john@test.com ");
    const result = parseCsv(csv);

    expect(result.headers).toEqual(["name", "email"]);
    expect(result.records[0].name).toBe("John");
  });
});