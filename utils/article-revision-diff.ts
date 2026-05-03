import { diffLines } from "diff";

export type DiffLinePart = {
  type: "equal" | "add" | "remove";
  text: string;
};

function normalizeText(text: string | null | undefined): string {
  if (text == null || text === "") return "";
  return typeof text === "string" ? text : "";
}

/**
 * Line-level markdown diff using `diff`. Labels are reserved for callers (e.g. UI captions).
 *
 * Semantic: removals are relative to **oldText**, additions relative to **newText**.
 */
export function diffLinesMarkdown(
  leftLabel: string,
  rightLabel: string,
  oldText: string | null | undefined,
  newText: string | null | undefined,
): DiffLinePart[] {
  void leftLabel;
  void rightLabel;

  const oldStr = normalizeText(oldText);
  const newStr = normalizeText(newText);
  const changes = diffLines(oldStr, newStr);

  const out: DiffLinePart[] = [];
  for (const change of changes) {
    const v = change.value;
    if (!v.length) continue;

    let type: DiffLinePart["type"] = "equal";
    if (change.added) type = "add";
    else if (change.removed) type = "remove";

    out.push({ type, text: v });
  }

  return out;
}
