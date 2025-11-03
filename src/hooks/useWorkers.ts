import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../api/client';
import { useApiQuery } from './useApiQuery';
import { Worker } from '../types/api';

type WorkerInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  commuteExpense?: number;
  shiftExpense?: number;
  mealExpense?: number;
  otherExpense?: number;
};

export const useWorkers = () => {
  const query = useApiQuery<Worker[]>(['workers'], '/workers');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: WorkerInput) =>
      apiRequest<Worker>('/workers', { method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<WorkerInput> }) =>
      apiRequest<Worker>(`/workers/${id}`, { method: 'PUT', body: payload }),
    onSuccess: (worker) => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['worker', worker.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<void>(`/workers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  const searchWorkers = (term: string) =>
    apiRequest<Worker[]>(`/workers?search=${encodeURIComponent(term)}`);

  return {
    ...query,
    createWorker: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateWorker: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteWorker: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    searchWorkers
  };
};
