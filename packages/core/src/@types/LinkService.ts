type LinkService = {
  openExternal: (url: string) => Promise<void>;
};

export default LinkService;
