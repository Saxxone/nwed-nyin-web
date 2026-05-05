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

/** Prefer default HTML paste when the clipboard already has real rich structure. */
export function clipboardHtmlLooksStructured(html: string): boolean {
  const h = html.trim().toLowerCase();
  if (!h) return false;

  return (
    /<h[1-6][\s>]/.test(h) ||
    /<ul[\s>]/.test(h) ||
    /<ol[\s>]/.test(h) ||
    /<blockquote[\s>]/.test(h) ||
    /<pre[\s>]/.test(h) ||
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
