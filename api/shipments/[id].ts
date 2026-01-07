import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../lib/db';
import { shipments, auditLogs } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const shipmentId = Array.isArray(id) ? id[0] : id;

  if (!shipmentId) {
    return res.status(400).json({ error: 'Shipment ID is required' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const result = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
      if (result.length === 0) {
        return res.status(404).json({ error: 'Shipment not found' });
      }
      return res.json(result[0]);
    }

    if (req.method === 'PATCH') {
      const [updated] = await db.update(shipments)
        .set({ ...req.body, lastUpdated: Date.now() })
        .where(eq(shipments.id, shipmentId))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        shipmentId: shipmentId,
        action: 'update',
        summary: `Updated shipment ${shipmentId}`,
        timestamp: Date.now(),
      });

      return res.json(updated);
    }

    if (req.method === 'DELETE') {
      const deleted = await db.delete(shipments).where(eq(shipments.id, shipmentId)).returning();
      if (deleted.length === 0) {
        return res.status(404).json({ error: 'Shipment not found' });
      }
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
