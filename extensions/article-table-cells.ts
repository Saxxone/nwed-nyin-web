import { TableCell, TableHeader } from "@tiptap/extension-table";

/**
 * Table cell background — uses inline style (sanitized in article-markdown-bridge).
 * `setCellAttribute('backgroundColor', value)` controls this from the editor.
 */
const backgroundColorAttr = {
  backgroundColor: {
    default: null as string | null,
    parseHTML: (element: HTMLElement) => {
      const fromStyle = (element.style?.backgroundColor ?? "").trim();
      if (fromStyle) return fromStyle;
      const data = element.getAttribute("data-bg-color")?.trim();
      return data || null;
    },
    renderHTML: (attributes: { backgroundColor?: string | null }) => {
      const v = attributes.backgroundColor?.trim();
      if (!v) return {};
      return {
        "data-bg-color": v,
        style: `background-color: ${v}`,
      };
    },
  },
};

export const ArticleTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...backgroundColorAttr,
    };
  },
});

export const ArticleTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...backgroundColorAttr,
    };
  },
});
