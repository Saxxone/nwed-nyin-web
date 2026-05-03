import DOMPurify from "dompurify";
import { marked } from "marked";
import TurndownService from "turndown";

function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["figure", "figcaption"],
    ADD_ATTR: ["class", "loading", "decoding", "width", "height"],
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
