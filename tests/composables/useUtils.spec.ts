import { describe, expect, it } from "vitest";
import { useNormalizeString } from "~/composables/useUtils";

describe("useNormalizeString", () => {
  it("removes diacritics, lowercases, and replaces whitespace", () => {
    expect(useNormalizeString("Ñwed Nnyịn")).toBe("nwed-nnyin");
  });

  it("collapses repeated whitespace into one dash", () => {
    expect(useNormalizeString("  Ọma   Nile  ")).toBe("-oma-nile-");
  });
});
