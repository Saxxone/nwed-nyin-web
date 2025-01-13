const api_routes = {
  dictionary: {
    list: "/dictionary",
    add: "/dictionary/add",
    update: (id: string) => `/dictionary/update/${id}`,
    view: (word: string) => `/dictionary/${word}`,
    search: (query: string) => `/dictionary/search?term=${query}`,
    parts_of_speech: "/dictionary/parts-of-speech",
  },
  archive: {
    list: "/archive",
    view: (id: string) => `/archive/${id}`,
    publish: `/archive/publish`,
    add: "/archive/add",
    update: (id: string) => `/archive/update/${id}`,
    search: (query: string) => `/archive/search?term=${query}`,
    edit: (id: string) => `/archive/${id}/edit`,
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
