const api_routes = {
  dictionary: {
    list: "/dictionary",
    add: "/dictionary/add",
    update: (id: string) => `/dictionary/update/${id}`,
    view: (word: string) => `/dictionary/${word}`,
    search: (query: string) => `/dictionary/search?term=${query}`,
    parts_of_speech: "/dictionary/parts-of-speech",
  },
  archives: {
    list: "/archives",
    view: (id: string) => `/archives/${id}`,
    add: "/archives/add",
    edit: (id: string) => `/archives/${id}/edit`,
  },
};

export default api_routes;
