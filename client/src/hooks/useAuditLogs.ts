import { useQuery } from '@tanstack/react-query';
import { AuditLog } from '@shared/schema';

export function useAuditLogs(shipmentId: string) {
  return useQuery<AuditLog[]>({
    queryKey: ['auditLogs', shipmentId],
    queryFn: async () => {
      const response = await fetch(`/api/shipments/${shipmentId}/audit-logs`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return response.json();
    },
    enabled: !!shipmentId,
  });
}
