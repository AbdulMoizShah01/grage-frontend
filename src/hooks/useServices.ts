import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../api/client';
import { useApiQuery } from './useApiQuery';
import { ServiceItem } from '../types/api';

type ServiceItemInput = {
  name: string;
  description?: string | null;
  defaultPrice: number;
};

type ServiceItemUpdateInput = Partial<ServiceItemInput>;

export const useServices = () => {
  const query = useApiQuery<ServiceItem[]>(['services'], '/services');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: ServiceItemInput) =>
      apiRequest<ServiceItem>('/services', { method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ServiceItemUpdateInput }) =>
      apiRequest<ServiceItem>(`/services/${id}`, { method: 'PUT', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<void>(`/services/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  const searchServiceItems = (term: string) =>
    apiRequest<ServiceItem[]>(`/services?search=${encodeURIComponent(term)}`);

  return {
    ...query,
    createServiceItem: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateServiceItem: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteServiceItem: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    searchServiceItems
  };
};
