const api_routes = {
  dictionary: {
    list: "/dictionary",
    add: "/dictionary/add",
    edit: (word: string) => `/dictionary/edit/${word}`,
    view: (word: string) => `/dictionary/${word}`,
  },
};

export default api_routes;
