const api_routes = {
  dictionary: {
    list: "/dictionary",
    add: "/dictionary/add",
    update: (id: string) => `/dictionary/update/${id}`,
    view: (word: string) => `/dictionary/${word}`,
    search: (query: string) => `/dictionary/search?term=${query}`,
    parts_of_speech: "/dictionary/parts-of-speech",
  },
  articles: {
    list: "/article",
    view: (slug: string) => `/article/${slug}`,
    publish: `/article/publish`,
    add: "/article/add",
    update: (slug: string) => `/article/update/${slug}`,
    search: (query: string) => `/article/search?term=${query}`,
    edit: (slug: string) => `/article/${slug}/edit`,
  },
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    google_login: "/auth/login/google",
    google_signup: "/auth/signup/google",
    logout: "/auth/logout",
    profile: "/auth/profile",
  },
  files: {
    upload: "/files/upload",
    download: (filename: string) => `/files/download/${filename}`,
  },
};

export default api_routes;
