import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../api/client';
import { useApiQuery } from './useApiQuery';
import { MetadataRecord } from '../types/api';

export type MetadataCustomerInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

export type MetadataVehicleInput = {
  vin: string;
  make: string;
  model: string;
  year: number;
  licensePlate?: string;
  mileage?: number;
  color?: string;
  engine?: string;
  notes?: string;
};

export type MetadataInput = {
  customer: MetadataCustomerInput;
  vehicle: MetadataVehicleInput;
};

export type MetadataUpdateInput = Partial<MetadataInput>;

export const useMetadata = (search: string) => {
  const queryClient = useQueryClient();
  const normalizedSearch = search.trim();
  const path = normalizedSearch ? `/metadata?search=${encodeURIComponent(normalizedSearch)}` : '/metadata';

  const query = useApiQuery<MetadataRecord[]>(['metadata', normalizedSearch], path);

  const createMutation = useMutation({
    mutationFn: (payload: MetadataInput) =>
      apiRequest<MetadataRecord>('/metadata', {
        method: 'POST',
        body: payload
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metadata'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ vehicleId, payload }: { vehicleId: number; payload: MetadataUpdateInput }) =>
      apiRequest<MetadataRecord>(`/metadata/${vehicleId}`, {
        method: 'PUT',
        body: payload
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metadata'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (vehicleId: number) =>
      apiRequest<void>(`/metadata/${vehicleId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metadata'] });
    }
  });

  return {
    ...query,
    createMetadata: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateMetadata: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteMetadata: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
};
