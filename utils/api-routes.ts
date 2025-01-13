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
};

export default api_routes;
