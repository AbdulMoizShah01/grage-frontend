
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../api/client';
import { useApiQuery } from './useApiQuery';
import { WorkOrder } from '../types/api';
import { WorkOrderStatus } from '../types/enums';

type CatalogLineItemInput =
  | {
      type: 'PART';
      name: string;
      quantity: number;
      unitPrice: number;
      description?: string | null;
      inventoryItemId?: number;
      sku?: string;
      initialStock?: number;
    }
  | {
      type: 'SERVICE';
      name: string;
      quantity: number;
      unitPrice: number;
      description?: string | null;
      serviceItemId?: number;
    };

type WorkerAssignmentInput = {
  workerId?: number;
  workerName?: string;
  role?: string | null;
  notes?: string | null;
  servicesCount?: number;
};

export type WorkOrderInput = {
  vehicleId: number;
  customerId?: number | null;
  description: string;
  arrivalDate: string;
  quotedAt?: string | null;
  scheduledDate?: string | null;
  completedDate?: string | null;
  parkingCharge?: number;
  laborCost?: number;
  partsCost?: number;
  taxes?: number;
  discount?: number;
  notes?: string | null;
  lineItems: CatalogLineItemInput[];
  assignments: WorkerAssignmentInput[];
};

export type WorkOrderFilters = {
  status?: WorkOrderStatus | 'ALL';
  from?: string;
  to?: string;
  search?: string;
  historical?: boolean;
};

const buildQueryPath = (filters: WorkOrderFilters) => {
  const params = new URLSearchParams();

  if (filters.status && filters.status !== 'ALL') {
    params.set('status', filters.status);
  }

  if (filters.from) {
    params.set('from', filters.from);
  }

  if (filters.to) {
    params.set('to', filters.to);
  }

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }

  if (typeof filters.historical === 'boolean') {
    params.set('historical', String(filters.historical));
  }

  const query = params.toString();
  return query ? `/work-orders?${query}` : '/work-orders';
};

export const useWorkOrders = (initialFilters: WorkOrderFilters = {}) => {
  const [filters, setFilters] = useState<WorkOrderFilters>(() => ({
    status: 'ALL',
    historical: false,
    ...initialFilters
  }));
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['work-orders', filters], [filters]);
  const path = useMemo(() => buildQueryPath(filters), [filters]);

  const query = useApiQuery<WorkOrder[]>(queryKey, path);

  const createMutation = useMutation({
    mutationFn: (payload: WorkOrderInput) =>
      apiRequest<WorkOrder>('/work-orders', {
        method: 'POST',
        body: payload
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest<void>(`/work-orders/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest<WorkOrder>(`/work-orders/${id}/complete`, {
        method: 'POST'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    }
  });

  const updateFilters = (next: Partial<WorkOrderFilters>) =>
    setFilters((previous) => ({
      ...previous,
      ...next
    }));

  return {
    ...query,
    filters,
    setFilters,
    updateFilters,
    createWorkOrder: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteWorkOrder: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    completeWorkOrder: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending
  };
};
