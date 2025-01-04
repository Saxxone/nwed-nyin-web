const app_routes = {
  archives: {
    list: "/archives",
    view: (id: string) => `/archives/${id}`,
    add: "/archives/add",
    edit: (id: string) => `/archives/${id}/edit`,
  },
  dictionary: {
    list: "/dictionary",
    add: "/dictionary/add",
    edit: (word: string) => `/dictionary/edit/${word}`,
    view: (word: string) => `/dictionary/${word}`,
  },
};

export default app_routes;
