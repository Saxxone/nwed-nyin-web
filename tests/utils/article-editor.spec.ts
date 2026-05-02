import { describe, expect, it } from "vitest";
import type { FormatAction } from "~/types/types";
import {
  createArticleFileMetadata,
  createArticleImageMarkup,
  formatMarkdownSelection,
  getArticleDraftKeys,
  insertMarkdownAtSelection,
  normalizeArticleImagePosition,
} from "~/utils/article-editor";

const boldAction: FormatAction = {
  label: "Bold",
  icon: "bold",
  formatting: "font-bold",
  command: "bold",
  markdown: { prefix: "**", suffix: "**" },
};

const linkAction: FormatAction = {
  label: "Link",
  icon: "link",
  formatting: "font-link",
  command: "link",
  markdown: { prefix: "[", suffix: "](url)" },
};

describe("article editor utilities", () => {
  it("keeps add and edit draft keys isolated", () => {
    expect(getArticleDraftKeys()).toEqual({
      title: "article:add:title",
      content: "article:add:content",
    });
    expect(getArticleDraftKeys("first-post")).toEqual({
      title: "article:edit:first-post:title",
      content: "article:edit:first-post:content",
    });
  });

  it("formats selected textarea content as markdown", () => {
    const result = formatMarkdownSelection(
      "A selected word",
      { start: 2, end: 10 },
      boldAction,
    );

    expect(result).toEqual({
      content: "A **selected** word",
      selection: { start: 4, end: 12 },
    });
  });

  it("prompts for links before formatting selected text", () => {
    const result = formatMarkdownSelection(
      "Read this article",
      { start: 5, end: 9 },
      linkAction,
      () => "https://example.com",
    );

    expect(result).toEqual({
      content: "Read [this](https://example.com) article",
      selection: { start: 6, end: 10 },
    });
  });

  it("inserts uploaded media markdown at the current selection", () => {
    const result = insertMarkdownAtSelection(
      "Intro\n\nOutro",
      { start: 7, end: 7 },
      " ![Alt text](https://cdn.example/image.png) ",
    );

    expect(result).toEqual({
      content: "Intro\n\n ![Alt text](https://cdn.example/image.png) Outro",
      selection: { start: 51, end: 51 },
    });
  });

  it("preserves uploaded media metadata for the article payload", () => {
    expect(
      createArticleFileMetadata({
        id: "file-1",
        type: "IMAGE",
        url: "https://cdn.example/image.png",
        path: "articles/image.png",
        mimetype: "image/png",
        name: "Map of Ala",
        description: "Annotated map",
      }),
    ).toEqual({
      id: "file-1",
      type: "IMAGE",
      url: "https://cdn.example/image.png",
      path: "articles/image.png",
      mimetype: "image/png",
      alt_text: "Annotated map",
      caption: "Map of Ala",
    });
  });

  it("normalizes unsupported article image positions to centered", () => {
    expect(normalizeArticleImagePosition("wide")).toBe("wide");
    expect(normalizeArticleImagePosition("unsupported")).toBe("center");
    expect(normalizeArticleImagePosition()).toBe("center");
  });

  it("generates escaped positioned article image markup", () => {
    const markup = createArticleImageMarkup({
      id: "file-1",
      type: "IMAGE",
      url: 'https://cdn.example/image.png?name="one"&size=<large>',
      path: "/files/image.png",
      mimetype: "image/png",
      name: "Caption <text>",
      description: 'Alt "quoted" & described',
      position: "right",
    });

    expect(markup).toContain(
      '<figure class="article-image article-image--right">',
    );
    expect(markup).toContain(
      'src="https://cdn.example/image.png?name=&quot;one&quot;&amp;size=&lt;large&gt;"',
    );
    expect(markup).toContain('alt="Alt &quot;quoted&quot; &amp; described"');
    expect(markup).toContain('loading="lazy" decoding="async"');
    expect(markup).toContain("<figcaption>Caption &lt;text&gt;</figcaption>");
  });

  it("inserts positioned image markup at the current selection", () => {
    const image_markup = createArticleImageMarkup({
      id: "file-1",
      type: "IMAGE",
      url: "https://cdn.example/image.png",
      path: "/files/image.png",
      mimetype: "image/png",
      name: "Image caption",
      description: "Image alt text",
      position: "wide",
    });
    const result = insertMarkdownAtSelection(
      "Intro\n\nOutro",
      { start: 7, end: 7 },
      image_markup,
    );

    expect(result.content).toContain(
      '<figure class="article-image article-image--wide">',
    );
    expect(result.content).toContain("<figcaption>Image caption</figcaption>");
    expect(result.selection).toEqual({
      start: 7 + image_markup.length,
      end: 7 + image_markup.length,
    });
  });
});
