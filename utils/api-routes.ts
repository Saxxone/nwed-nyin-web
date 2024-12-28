const api_routes = {
  dictionary: {
    list: "/dictionary",
    add: "/dictionary/add",
    edit: (word: string) => `/dictionary/edit/${word}`,
    view: (word: string) => `/dictionary/${word}`,
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
