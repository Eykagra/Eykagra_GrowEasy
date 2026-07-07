import { describe, expect, it } from "vitest";
import { splitIntoBatches } from "../batchConfig.js";

describe("splitIntoBatches", () => {
  it("splits items into fixed-size chunks", () => {
    const items = Array.from({ length: 10 }, (_, i) => i);
    expect(splitIntoBatches(items, 3)).toEqual([
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [9],
    ]);
  });

  it("returns one batch when items fit", () => {
    expect(splitIntoBatches([1, 2], 25)).toEqual([[1, 2]]);
  });

  it("returns empty array for empty input", () => {
    expect(splitIntoBatches([], 25)).toEqual([]);
  });
});