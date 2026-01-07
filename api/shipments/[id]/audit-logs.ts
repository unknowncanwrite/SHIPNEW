import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../lib/db';
import { auditLogs } from '../../../shared/schema';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const shipmentId = Array.isArray(id) ? id[0] : id;

  if (!shipmentId) {
    return res.status(400).json({ error: 'Shipment ID is required' });
  }

  try {
    if (req.method === 'GET') {
      const result = await db.select().from(auditLogs)
        .where(eq(auditLogs.shipmentId, shipmentId))
        .orderBy(desc(auditLogs.timestamp));
      return res.json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
