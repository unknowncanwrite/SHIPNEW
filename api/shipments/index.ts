import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectMongoDB, ShipmentModel, AuditLogModel } from '../lib/mongodb';

function docToShipment(doc: any) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id,
    createdAt: obj.createdAt,
    lastUpdated: obj.lastUpdated,
    shipmentType: obj.shipmentType || 'with-inspection',
    forwarder: obj.forwarder || '',
    manualForwarderName: obj.manualForwarderName || '',
    manualMethod: obj.manualMethod || 'email',
    fumigation: obj.fumigation || 'sky-services',
    manualFumigationName: obj.manualFumigationName || '',
    manualFumigationMethod: obj.manualFumigationMethod || 'email',
    details: obj.details || {},
    commercial: obj.commercial || {},
    actual: obj.actual || {},
    customTasks: obj.customTasks || [],
    documents: obj.documents || [],
    checklist: obj.checklist instanceof Map ? Object.fromEntries(obj.checklist) : (obj.checklist || {}),
    shipmentChecklist: obj.shipmentChecklist || [],
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectMongoDB();

    if (req.method === 'GET') {
      const docs = await ShipmentModel.find().sort({ createdAt: -1 });
      return res.json(docs.map(docToShipment));
    }

    if (req.method === 'POST') {
      const data = req.body;
      const now = Date.now();
      const doc = await ShipmentModel.create({
        _id: data.id,
        ...data,
        createdAt: data.createdAt ?? now,
        lastUpdated: data.lastUpdated ?? now,
      });
      
      await AuditLogModel.create({
        shipmentId: data.id,
        action: 'create',
        summary: `Created shipment ${data.id}`,
        timestamp: now,
      });
      
      return res.status(201).json(docToShipment(doc));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
