import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../api/client';
import { useApiQuery } from './useApiQuery';
import { Vehicle } from '../types/api';

type VehicleInput = {
  vin: string;
  make: string;
  model: string;
  year: number;
  licensePlate?: string | null;
  mileage?: number | null;
  color?: string | null;
  engine?: string | null;
  notes?: string | null;
  customerId: number;
};

export const useVehicles = () => {
  const query = useApiQuery<Vehicle[]>(['vehicles'], '/vehicles');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: VehicleInput) => apiRequest<Vehicle>('/vehicles', { method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<void>(`/vehicles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    }
  });

  return {
    ...query,
    createVehicle: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteVehicle: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
};
