export interface ArticleFile {
  id?: string;
  type?: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  url?: string;
  path?: string;
  mimetype?: string;
  alt_text?: string | null;
}

export interface Article {
  id?: string;
  content: string;
  title: string;
  slug?: string;
  summary?: string;
  file?: ArticleFile[];
}
