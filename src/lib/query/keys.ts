export const queryKeys = {
  listings: {
    detail: (id: string) => ['listings', 'detail', id] as const,
  },
};
