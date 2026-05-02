export interface ArticleFile {
  id?: string;
  type?: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  url?: string;
  path?: string;
  mimetype?: string;
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
