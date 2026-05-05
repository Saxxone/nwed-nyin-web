const api_routes = {
  dictionary: {
    list: "/dictionary",
    add: "/dictionary/add",
    update: (id: string) => `/dictionary/update/${id}`,
    updateSound: (id: string) => `/file/upload-sound/${id}`,
    view: (word: string) => `/dictionary/${word}`,
    viewById: (id: string) => `/dictionary/id/${id}`,
    search: (query: string) => `/dictionary/search?term=${query}`,
    jump: `/dictionary/jump`,
    parts_of_speech: "/dictionary/parts-of-speech",
    getSound: (path: string) =>
      `/dictionary/sound?path=${encodeURIComponent(path)}`,
  },
  articles: {
    list: "/article",
    view: (slug: string) => `/article/article/${slug}`,
    getMarkdown: (path: string) => `/article/markdown?path=${path}`,
    publish: `/article/publish`,
    add: "/article/add",
    update: (id: string) => `/article/update/${id}`,
    revisions: (id: string) => `/article/revisions/${id}`,
    revisionAt: (id: string, version: number) =>
      `/article/revisions/${id}/v/${version}`,
    search: (query: string, skip: number = 0, take: number = 10) =>
      `/article/search?term=${encodeURIComponent(
        query,
      )}&skip=${encodeURIComponent(skip)}&take=${encodeURIComponent(take)}`,
    related: ({
      source,
      slug,
      terms = [],
      excludeSlugs = [],
      take = 5,
    }: {
      source: "article" | "word";
      slug?: string;
      terms?: string[];
      excludeSlugs?: string[];
      take?: number;
    }) => {
      const params = new URLSearchParams({
        source,
        take: String(take),
      });

      if (slug) params.set("slug", slug);
      if (terms.length) params.set("terms", terms.join(","));
      if (excludeSlugs.length)
        params.set("excludeSlugs", excludeSlugs.join(","));

      return `/article/related?${params.toString()}`;
    },
    edit: (slug: string) => `/article/${slug}/edit`,
  },
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    google_login: "/auth/login/google",
    google_signup: "/auth/signup/google",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    profile: "/auth/profile",
  },
  files: {
    upload: "/file/upload",
    getUrls: "/file/file-urls",
    download: (filename: string) => `/file/download/${filename}`,
  },
};

export default api_routes;
