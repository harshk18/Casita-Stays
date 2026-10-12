import { ListingsQuery } from '../validation/schemas';

export const queryKeys = {
  listings: {
    all: ['listings'] as const,
    list: (params: ListingsQuery) => ['listings', 'list', params] as const,
    detail: (id: string) => ['listings', 'detail', id] as const,
  },
};
