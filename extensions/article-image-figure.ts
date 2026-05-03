import { Node } from "@tiptap/core";

function parseImgDimension(attr: string | null): number | null {
  if (attr == null || attr.trim() === "") return null;
  const parsed = Number.parseInt(attr, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Block image+figcaption matching `createArticleImageMarkup` / server markdown. */
export const ArticleImageFigure = Node.create({
  name: "articleImageFigure",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null as string | null },
      alt: { default: "" },
      caption: { default: "" },
      position: { default: "center" },
      width: { default: null as number | null },
      height: { default: null as number | null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure.article-image",
        getAttrs(element) {
          const el = element as HTMLElement;
          const img = el.querySelector("img");
          if (!img) return false;
          const cap = el.querySelector("figcaption");
          const cls = el.getAttribute("class") || "";
          const m = cls.match(/article-image--(\w+)/);
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") ?? "",
            caption: cap?.textContent?.trim() ?? "",
            position: m?.[1] ?? "center",
            width: parseImgDimension(img.getAttribute("width")),
            height: parseImgDimension(img.getAttribute("height")),
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const { src, alt, caption, position, width, height } = node.attrs;
    if (!src) return ["p", {}, ""];

    const pos = typeof position === "string" ? position : "center";
    const figClass = `article-image article-image--${pos}`;
    const img_attrs: Record<string, string | number | undefined> = {
      src,
      alt: alt || "",
      loading: "lazy",
      decoding: "async",
    };
    if (
      typeof width === "number" &&
      Number.isFinite(width) &&
      width > 0
    ) {
      img_attrs.width = width;
    }
    if (
      typeof height === "number" &&
      Number.isFinite(height) &&
      height > 0
    ) {
      img_attrs.height = height;
    }
    const img: ["img", Record<string, string | number | undefined>] = [
      "img",
      img_attrs,
    ];

    if (caption)
      return ["figure", { class: figClass }, img, ["figcaption", {}, caption]];

    return ["figure", { class: figClass }, img];
  },
});
