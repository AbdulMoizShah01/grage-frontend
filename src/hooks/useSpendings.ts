import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../api/client';
import { useApiQuery } from './useApiQuery';
import { Spending } from '../types/api';

type SpendingInput = {
  category: Spending['category'];
  amount: number;
  description?: string | null;
  incurredAt?: string;
};

export const useSpendings = () => {
  const query = useApiQuery<Spending[]>(['spendings'], '/spendings');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: SpendingInput) =>
      apiRequest<Spending>('/spendings', { method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spendings'] });
      queryClient.invalidateQueries({ queryKey: ['insights', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<SpendingInput> }) =>
      apiRequest<Spending>(`/spendings/${id}`, { method: 'PUT', body: payload }),
    onSuccess: (spending) => {
      queryClient.invalidateQueries({ queryKey: ['spendings'] });
      queryClient.invalidateQueries({ queryKey: ['spending', spending.id] });
      queryClient.invalidateQueries({ queryKey: ['insights', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<void>(`/spendings/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spendings'] });
      queryClient.invalidateQueries({ queryKey: ['insights', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  return {
    ...query,
    createSpending: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateSpending: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteSpending: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
};
