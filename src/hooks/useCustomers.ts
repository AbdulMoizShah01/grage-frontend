import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../api/client';
import { useApiQuery } from './useApiQuery';
import { Customer } from '../types/api';

type CustomerInput = {
  fullName: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  notes?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
};

export const useCustomers = () => {
  const query = useApiQuery<Customer[]>(['customers'], '/customers');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CustomerInput) => apiRequest<Customer>('/customers', { method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<void>(`/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    }
  });

  return {
    ...query,
    createCustomer: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteCustomer: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
};
