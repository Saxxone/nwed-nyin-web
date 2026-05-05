import DOMPurify from "dompurify";
import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const TABLE_TAGS = [
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "colgroup",
  "col",
] as const;

let dompurify_hooks_installed = false;

function allowSafeTableCellStyle(node: Element, style: string | undefined): string {
  if (!style?.trim()) return "";
  const parts = style.split(";").map((s) => s.trim()).filter(Boolean);
  const allowed: string[] = [];
  for (const p of parts) {
    const idx = p.indexOf(":");
    if (idx === -1) continue;
    const prop = p.slice(0, idx).trim().toLowerCase();
    const val = p.slice(idx + 1).trim();
    if (!val) continue;
    if (prop === "text-align") {
      const v = val.toLowerCase();
      if (v === "left" || v === "right" || v === "center") allowed.push(`${prop}: ${v}`);
    }
    if (prop === "background-color") {
      if (/^rgba?\([\d\s.,%]+\)$/i.test(val) || /^#[0-9a-f]{3,8}$/i.test(val))
        allowed.push(`${prop}: ${val}`);
    }
  }
  return allowed.join("; ");
}

function installTableSanitizerHooks(): void {
  if (dompurify_hooks_installed) return;
  dompurify_hooks_installed = true;

  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    const el = node as Element;
    const name = data.attrName;
    if (name !== "style") return;
    const tag = el.nodeName;
    if (tag !== "TD" && tag !== "TH" && tag !== "TABLE" && tag !== "COL")
      return;
    const safe = allowSafeTableCellStyle(el, el.getAttribute("style") ?? undefined);
    if (safe) {
      el.setAttribute("style", safe);
      data.keepAttr = true;
    } else {
      data.keepAttr = false;
    }
  });
}

function sanitizeArticleHtml(html: string): string {
  installTableSanitizerHooks();
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["figure", "figcaption", ...TABLE_TAGS],
    ADD_ATTR: [
      "class",
      "loading",
      "decoding",
      "width",
      "height",
      "colspan",
      "rowspan",
      "align",
      "scope",
      "style",
      "colwidth",
      "data-bg-color",
    ],
  });
}

/** Used by paste normalization — same rules as markdown pipeline. */
export function sanitizeArticleEditorHtml(html: string): string {
  return sanitizeArticleHtml(html);
}

export async function markdownToEditorHtml(markdown: string): Promise<string> {
  const md = markdown?.trim() ? markdown : "";
  if (!md) return "<p></p>";

  const raw = await marked.parse(md, { breaks: true });
  const html = typeof raw === "string" ? raw : String(raw);
  const clean = sanitizeArticleHtml(html).trim();
  return clean || "<p></p>";
}

/** Same pipeline as {@link markdownToEditorHtml} for synchronous callers (e.g. paste handler). */
export function markdownToEditorHtmlSync(markdown: string): string {
  const md = markdown?.trim() ? markdown : "";
  if (!md) return "<p></p>";

  const raw = marked.parse(md, { breaks: true, async: false });
  const html = typeof raw === "string" ? raw : String(raw);
  const clean = sanitizeArticleHtml(html).trim();
  return clean || "<p></p>";
}

/** Heuristic: clipboard plain text is probably markdown (vs. a normal sentence). */
export function looksLikeMarkdown(text: string): boolean {
  const t = text.trim();
  if (t.length < 2) return false;

  // ATX headings: allow optional space after hashes (##Title and ## Title)
  if (/^#{1,6}(\s|$|\S)/m.test(t)) return true;
  if (/^\s{0,3}[-*+]\s/m.test(t)) return true;
  if (/^\s{0,3}\d+\.\s/m.test(t)) return true;
  if (/^>\s/m.test(t)) return true;
  if (/```/.test(t)) return true;
  if (/\[[^\]]*\]\([^)]+\)/.test(t)) return true;
  if (/!\[[^\]]*\]\([^)]+\)/.test(t)) return true;
  if (/\*\*[^*\n]/.test(t)) return true;
  if (/__[^_\n]/.test(t)) return true;
  if (/~~[^~\n]/.test(t)) return true;
  if (/^[-*]{3,}\s*$/m.test(t)) return true;
  // GFM pipe table (header row + separator)
  if (/^\s*\|?.+\|.+\|\s*$/m.test(t) && /^\s*\|[\s\-:|]+\|\s*$/m.test(t))
    return true;

  return false;
}

function escapeHtmlPlainText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function clipboardPlainLooksLikeFencedCodeBlock(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return /^```[\s\S]*```/m.test(t) || t.startsWith("```");
}

function preLooksLikeSourceEditorHighlighting(pre: HTMLPreElement): boolean {
  const cls = `${pre.className} ${pre.getAttribute("class") ?? ""}`;
  if (/language-|hljs|prettyprint|line-numbers|wp-block-code/i.test(cls))
    return true;
  if (
    pre.querySelector(
      ".hljs, .token, [class*='syntax'], [class*='highlight']",
    )
  )
    return true;
  return false;
}

/**
 * Find a single "prose in pre" block: Windows/Office often wraps `<pre>` in `<div>`,
 * or only a `<pre>` is the real content among wrappers (cf. plain macOS single `<pre>`).
 */
function findLoneProsePreInPaste(body: HTMLElement): HTMLPreElement | null {
  const skipTags = new Set([
    "meta",
    "style",
    "title",
    "link",
    "base",
    "script",
  ]);

  const meaningfulTop = [...body.children].filter((el) => {
    const t = el.tagName.toLowerCase();
    if (skipTags.has(t)) return false;
    return true;
  });

  if (meaningfulTop.length === 1 && meaningfulTop[0]!.tagName.toLowerCase() === "pre") {
    return meaningfulTop[0] as HTMLPreElement;
  }

  if (
    meaningfulTop.length === 1 &&
    meaningfulTop[0]!.tagName.toLowerCase() === "div"
  ) {
    const div = meaningfulTop[0]!;
    const inner = [...div.children].filter((el) => {
      const t = el.tagName.toLowerCase();
      if (skipTags.has(t)) return false;
      return true;
    });
    if (
      inner.length === 1 &&
      inner[0]!.tagName.toLowerCase() === "pre"
    ) {
      return inner[0] as HTMLPreElement;
    }
  }

  const allPres = body.querySelectorAll("pre");
  if (allPres.length !== 1) return null;
  const onlyPre = allPres[0] as HTMLPreElement;
  const bodyLen = (body.textContent ?? "").replace(/\s+/g, " ").trim().length;
  const preLen = (onlyPre.textContent ?? "").replace(/\s+/g, " ").trim().length;
  if (bodyLen === 0) return null;
  if (preLen / bodyLen >= 0.85) return onlyPre;

  return null;
}

/**
 * When apps wrap formatted prose in `<pre>` / `<pre><code>` (common on macOS "Match Style"
 * and some Windows sources), TipTap would otherwise create a code block.
 * Unwrap to paragraphs, markdown, or inline HTML. Platform-agnostic — uses pasted HTML only.
 */
export function normalizePastedHtmlProseForEditor(html: string): string {
  if (!html?.trim() || !/<pre\b/i.test(html)) return html;

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch {
    return html;
  }

  const body = doc.body;
  const pre = findLoneProsePreInPaste(body);
  if (!pre) return html;

  if (preLooksLikeSourceEditorHighlighting(pre)) return html;

  const innerBlock = pre.querySelector(":scope > code") ?? pre;
  const innerText = innerBlock.textContent ?? "";

  if (clipboardPlainLooksLikeFencedCodeBlock(innerText)) return html;

  const innerHtmlRaw = innerBlock.innerHTML.trim();

  if (/<\s*(strong|b|em|i|u|a|span|br)\b/i.test(innerHtmlRaw)) {
    const wrap = doc.createElement("div");
    wrap.innerHTML = innerHtmlRaw;
    return sanitizeArticleEditorHtml(wrap.innerHTML);
  }

  const plain = innerText.trim();
  if (!plain) return html;

  if (looksLikeMarkdown(plain)) return markdownToEditorHtmlSync(plain);

  const paras = plain.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paras.length === 0) return "<p></p>";
  if (paras.length === 1) {
    return sanitizeArticleEditorHtml(
      `<p>${escapeHtmlPlainText(paras[0]!).replace(/\n/g, "<br>")}</p>`,
    );
  }
  return sanitizeArticleEditorHtml(
    paras
      .map((p) => `<p>${escapeHtmlPlainText(p).replace(/\n/g, "<br>")}</p>`)
      .join(""),
  );
}

/** Prefer default HTML paste when the clipboard already has real rich document structure.
 *  Note: `<pre>` is excluded — many apps wrap *formatted prose* in pre/code on paste (macOS/Windows);
 *  those are normalized via {@link normalizePastedHtmlProseForEditor} instead of becoming a code block.
 */
export function clipboardHtmlLooksStructured(html: string): boolean {
  const h = html.trim().toLowerCase();
  if (!h) return false;

  return (
    /<h[1-6][\s>]/.test(h) ||
    /<ul[\s>]/.test(h) ||
    /<ol[\s>]/.test(h) ||
    /<blockquote[\s>]/.test(h) ||
    /<table[\s>]/.test(h) ||
    /<figure[\s>]/.test(h)
  );
}

let turndownInstance: TurndownService | null = null;

function getTurndown(): TurndownService {
  if (!turndownInstance) {
    const td = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      emDelimiter: "_",
    });
    gfm(td);

    td.addRule("articleFigure", {
      filter(node) {
        return (
          node.nodeName === "FIGURE" &&
          (node as HTMLElement).classList.contains("article-image")
        );
      },
      replacement(_content, node) {
        return `\n\n${(node as HTMLElement).outerHTML}\n\n`;
      },
    });

    turndownInstance = td;
  }
  return turndownInstance;
}

/** Serialize editor document HTML back to markdown for API / storage. */
export function editorHtmlToMarkdown(html: string): string {
  return getTurndown().turndown(html).replace(/\n+$/, "");
}
