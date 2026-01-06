import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import type { ShipmentData } from '@/types/shipment';

export function useShipments() {
  return useQuery({
    queryKey: ['shipments'],
    queryFn: api.fetchShipments,
  });
}

export function useShipment(id: string) {
  return useQuery({
    queryKey: ['shipments', id],
    queryFn: () => api.fetchShipment(id),
    enabled: !!id,
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createShipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });
}

export function useUpdateShipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ShipmentData> }) =>
      api.updateShipment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.id] });
    },
  });
}

export function useDeleteShipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteShipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });
}
