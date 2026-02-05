import { QueryClient } from "@tanstack/react-query";

const defaultOptions = {
  queries: {
    staleTime: 60 * 1000,
    retry: 1,
  },
};

export function createQueryClient() {
  return new QueryClient({
    defaultOptions,
  });
}
