import { Node } from "@tiptap/core";

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
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const { src, alt, caption, position } = node.attrs;
    if (!src) return ["p", {}, ""];

    const pos = typeof position === "string" ? position : "center";
    const figClass = `article-image article-image--${pos}`;
    const img: ["img", Record<string, string>] = [
      "img",
      {
        src,
        alt: alt || "",
        loading: "lazy",
        decoding: "async",
      },
    ];

    if (caption)
      return ["figure", { class: figClass }, img, ["figcaption", {}, caption]];

    return ["figure", { class: figClass }, img];
  },
});
