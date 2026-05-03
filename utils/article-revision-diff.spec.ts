import { describe, expect, it } from "vitest";
import { diffLinesMarkdown } from "./article-revision-diff";

describe("diffLinesMarkdown", () => {
  it("reports added and removed runs", () => {
    const parts = diffLinesMarkdown("a", "b", "one\ntwo", "one\nTHREE");
    expect(parts.some((p) => p.type === "equal")).toBe(true);
    expect(parts.some((p) => p.type === "remove" && /two/.test(p.text))).toBe(
      true,
    );
    expect(parts.some((p) => p.type === "add" && /THREE/.test(p.text))).toBe(
      true,
    );
  });

  it("normalizes nullish inputs", () => {
    const parts = diffLinesMarkdown("", "", undefined, "only");
    expect(parts.length >= 1).toBe(true);
    expect(parts.some((p) => p.type === "add")).toBe(true);
  });
});
