const app_routes = {
  articles: {
    list: "/articles",
    view: (slug: string) => `/articles/${slug}`,
    add: "/articles/add",
    edit: (slug: string) => `/articles/add?action=edit&article=${encodeURI(slug)}`,
  },
  dictionary: {
    list: "/dictionary",
    add: "/dictionary/add",
    edit: (word: string) =>
      `/dictionary/add?action=edit&word=${encodeURI(word)}`,
    view: (word: string) => `/dictionary/${word}`,
  },
  auth: {
    login: "/auth/login",
    signup: "/auth/signup",
    profile: "/auth/profile",
  },
};

export default app_routes;
