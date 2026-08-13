export interface ArticleFile {
  id?: string;
  type?: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  url?: string;
  path?: string;
  mimetype?: string;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
  credit?: string | null;
  alt_text?: string | null;
}

export interface ArticleReference {
  id: string;
  type: "BOOK" | "ARTICLE" | "WEBSITE" | "JOURNAL" | "OTHER";
  citation: string;
  url?: string | null;
  doi?: string | null;
  isbn?: string | null;
  authors?: unknown;
  publisher?: string | null;
  year?: number | null;
  access_date?: string | Date;
}

export interface ArticleMetadata {
  keywords?: unknown;
  language: string;
  read_time?: number | null;
  complexity?: string | null;
}

export interface ArticleContributor {
  id: string;
  name: string;
  img: string;
}

/** Snapshot payload from ArticleVersion.content (aligned with API). */
export interface ArticleRevisionContent {
  title?: string;
  summary?: string;
  body?: string;
  markdown?: string;
}

export interface ArticleRevision {
  id: string;
  article_id: string;
  version: number;
  created_at: string;
  created_by: string;
  content: unknown;
  /** If the API could not find this revision number, it returns the latest stored row with version <= requested. */
  requested_version?: number;
}

export interface Article {
  id?: string;
  content: string;
  title: string;
  slug?: string;
  summary?: string;
  file?: ArticleFile[];
  categories?: string[];
  tags?: string[];
  references?: ArticleReference[];
  metadata?: ArticleMetadata | null;
  contributors?: ArticleContributor[];
}

export interface ArticleSearchHit extends Article {
  search_match: {
    field: "title" | "summary" | "slug" | "tag" | "category" | "section";
    text: string;
  };
}
