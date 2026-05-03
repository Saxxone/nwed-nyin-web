import type { ArticleFile } from "~/types/article";
import type { FormatAction } from "~/types/types";

export type TextSelectionRange = {
  start: number;
  end: number;
};

export type DraftStorageKeys = {
  title: string;
  content: string;
};

export type ArticleImagePosition =
  | "center"
  | "left"
  | "right"
  | "wide"
  | "full";

export type UploadedArticleFileData = {
  name: string;
  description: string;
  position?: ArticleImagePosition;
} & Required<Pick<ArticleFile, "id" | "type" | "url" | "path" | "mimetype">>;

const DEFAULT_IMAGE_POSITION: ArticleImagePosition = "center";
const IMAGE_POSITIONS = new Set<ArticleImagePosition>([
  "center",
  "left",
  "right",
  "wide",
  "full",
]);

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function normalizeArticleImagePosition(
  position?: string | null,
): ArticleImagePosition {
  return IMAGE_POSITIONS.has(position as ArticleImagePosition)
    ? (position as ArticleImagePosition)
    : DEFAULT_IMAGE_POSITION;
}

export function createArticleImageMarkup(
  data: UploadedArticleFileData,
): string {
  const position = normalizeArticleImagePosition(data.position);
  const alt_text = data.description.trim() || data.name.trim();
  const caption = data.name.trim();

  const lines = [
    "",
    `<figure class="article-image article-image--${position}">`,
    `  <img src="${escapeHtmlAttribute(data.url)}" alt="${escapeHtmlAttribute(
      alt_text,
    )}" loading="lazy" decoding="async">`,
  ];

  if (caption)
    lines.push(`  <figcaption>${escapeHtmlText(caption)}</figcaption>`);

  lines.push("</figure>", "");
  return lines.join("\n");
}

export function getArticleDraftKeys(slug?: string | null): DraftStorageKeys {
  if (slug) {
    return {
      title: `article:edit:${slug}:title`,
      content: `article:edit:${slug}:content`,
    };
  }

  return {
    title: "article:add:title",
    content: "article:add:content",
  };
}

export function formatMarkdownSelection(
  content: string,
  selection: TextSelectionRange,
  action: FormatAction,
  getUrl: () => string | null = () => null,
): { content: string; selection: TextSelectionRange } | null {
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);
  const selected_text = content.slice(start, end);

  if (!selected_text) return null;

  const prefix = action.markdown.prefix;
  const suffix = action.markdown.suffix ?? action.markdown.prefix;
  let replacement = "";
  let next_selection: TextSelectionRange = { start, end };

  switch (action.command) {
    case "link": {
      const url = getUrl();
      if (!url) return null;
      replacement = `[${selected_text}](${url})`;
      next_selection = {
        start: start + 1,
        end: start + selected_text.length + 1,
      };
      break;
    }
    case "heading":
    case "quote":
    case "list": {
      replacement = selected_text
        .split("\n")
        .map((line) => `${prefix}${line}`)
        .join("\n");
      next_selection = {
        start: start + prefix.length,
        end: start + replacement.length,
      };
      break;
    }
    default:
      replacement = `${prefix}${selected_text}${suffix}`;
      next_selection = {
        start: start + prefix.length,
        end: start + prefix.length + selected_text.length,
      };
      break;
  }

  return {
    content: `${content.slice(0, start)}${replacement}${content.slice(end)}`,
    selection: next_selection,
  };
}

export function insertMarkdownAtSelection(
  content: string,
  selection: TextSelectionRange,
  insertion: string,
): { content: string; selection: TextSelectionRange } {
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);
  const next_position = start + insertion.length;

  return {
    content: `${content.slice(0, start)}${insertion}${content.slice(end)}`,
    selection: {
      start: next_position,
      end: next_position,
    },
  };
}

export function createArticleFileMetadata(
  data: UploadedArticleFileData,
): ArticleFile {
  return {
    id: data.id,
    type: data.type,
    url: data.url,
    path: data.path,
    mimetype: data.mimetype,
    alt_text: data.description,
    caption: data.name,
  };
}
