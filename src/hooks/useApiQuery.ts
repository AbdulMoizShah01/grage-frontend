import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';

import { apiRequest } from '../api/client';

export const useApiQuery = <TData>(
  key: QueryKey,
  path: string,
  options?: Omit<UseQueryOptions<TData, Error, TData, QueryKey>, 'queryKey' | 'queryFn'>
) =>
  useQuery<TData, Error>({
    queryKey: key,
    queryFn: () => apiRequest<TData>(path),
    ...options
  });
