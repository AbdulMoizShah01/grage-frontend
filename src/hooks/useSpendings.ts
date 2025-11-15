import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest, ApiError } from '../api/client';
import { Spending } from '../types/api';
import { SpendingInput } from '../types/spendings';
import {
  addLocalSpending,
  deleteLocalSpending,
  getLocalSpendings,
  updateLocalSpending
} from '../utils/localSpendingsStore';

const spendingsApiMode = (import.meta.env.VITE_SPENDINGS_API_MODE ?? 'auto').toLowerCase();
const forceLocalSpendings = spendingsApiMode === 'local';
const forceRemoteSpendings = spendingsApiMode === 'remote';
const STORAGE_KEY = 'grage-spendings-use-local';
const canUseBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readPersistedLocalPreference = () => {
  if (forceLocalSpendings || !canUseBrowserStorage()) {
    return forceLocalSpendings;
  }

  return window.localStorage.getItem(STORAGE_KEY) === 'true';
};

const persistLocalPreference = () => {
  if (!canUseBrowserStorage()) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // Ignore storage errors – we can fall back to memory flag.
  }
};

let shouldUseLocalSpendings = forceLocalSpendings || readPersistedLocalPreference();

const markSpendingsApiUnavailable = () => {
  if (!forceRemoteSpendings) {
    shouldUseLocalSpendings = true;
    persistLocalPreference();
  }
};

const fetchSpendings = async () => {
  if (shouldUseLocalSpendings) {
    return getLocalSpendings();
  }

  try {
    return await apiRequest<Spending[]>('/spendings');
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && !forceRemoteSpendings) {
      markSpendingsApiUnavailable();
      return getLocalSpendings();
    }
    throw error;
  }
};

const createSpendingViaApi = async (payload: SpendingInput) => {
  if (shouldUseLocalSpendings) {
    return addLocalSpending(payload);
  }

  try {
    return await apiRequest<Spending>('/spendings', { method: 'POST', body: payload });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && !forceRemoteSpendings) {
      markSpendingsApiUnavailable();
      return addLocalSpending(payload);
    }
    throw error;
  }
};

const updateSpendingViaApi = async (params: { id: number; payload: Partial<SpendingInput> }) => {
  if (shouldUseLocalSpendings) {
    return updateLocalSpending(params.id, params.payload);
  }

  try {
    return await apiRequest<Spending>(`/spendings/${params.id}`, {
      method: 'PUT',
      body: params.payload
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && !forceRemoteSpendings) {
      markSpendingsApiUnavailable();
      return updateLocalSpending(params.id, params.payload);
    }
    throw error;
  }
};

const deleteSpendingViaApi = async (id: number) => {
  if (shouldUseLocalSpendings) {
    deleteLocalSpending(id);
    return;
  }

  try {
    await apiRequest<void>(`/spendings/${id}`, { method: 'DELETE' });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && !forceRemoteSpendings) {
      markSpendingsApiUnavailable();
      deleteLocalSpending(id);
      return;
    }
    throw error;
  }
};

export const useSpendings = () => {
  const query = useQuery<Spending[]>({
    queryKey: ['spendings'],
    queryFn: fetchSpendings,
    placeholderData: []
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createSpendingViaApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spendings'] });
      queryClient.invalidateQueries({ queryKey: ['insights', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateSpendingViaApi,
    onSuccess: (spending) => {
      queryClient.invalidateQueries({ queryKey: ['spendings'] });
      queryClient.invalidateQueries({ queryKey: ['spending', spending.id] });
      queryClient.invalidateQueries({ queryKey: ['insights', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSpendingViaApi,
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
