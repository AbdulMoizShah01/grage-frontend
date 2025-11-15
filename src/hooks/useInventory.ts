import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../api/client';
import { useApiQuery } from './useApiQuery';
import { InventoryItem } from '../types/api';

type InventoryItemInput = {
  name: string;
  sku?: string;
  description?: string | null;
  quantityOnHand?: number;
  reorderPoint?: number;
  unitCost?: number;
  unitPrice?: number;
};

export const useInventory = (search?: string) => {
  const normalizedSearch = search?.trim() ?? '';
  const path = normalizedSearch
    ? `/inventory?search=${encodeURIComponent(normalizedSearch)}`
    : '/inventory';
  const query = useApiQuery<InventoryItem[]>(['inventory', normalizedSearch], path);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: InventoryItemInput) =>
      apiRequest<InventoryItem>('/inventory', { method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: InventoryItemInput }) =>
      apiRequest<InventoryItem>(`/inventory/${id}`, { method: 'PUT', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<void>(`/inventory/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  return {
    ...query,
    createInventoryItem: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateInventoryItem: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteInventoryItem: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
};
