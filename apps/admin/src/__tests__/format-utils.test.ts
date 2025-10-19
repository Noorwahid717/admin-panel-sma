import { describe, expect, it } from "vitest";

import { formatWeekLabel, percent } from "../utils/format";

describe("formatWeekLabel", () => {
  it("formats ISO week strings into human readable labels", () => {
    expect(formatWeekLabel("2024-W34")).toBe("Minggu ke-34 (Agustus 2024)");
  });

  it("falls back to original input for invalid values", () => {
    expect(formatWeekLabel("invalid-week")).toBe("invalid-week");
  });
});

describe("percent", () => {
  it("formats whole numbers with one decimal by default", () => {
    expect(percent(80)).toBe("80,0%");
  });

  it("respects the number of fraction digits provided", () => {
    expect(percent(92.345, 2)).toBe("92,35%");
  });

  it("guards against invalid numbers", () => {
    expect(percent(Number.NaN)).toBe("0%");
  });
});
