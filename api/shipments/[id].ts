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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    await connectMongoDB();

    if (req.method === 'GET') {
      const doc = await ShipmentModel.findById(id);
      if (!doc) {
        return res.status(404).json({ error: 'Shipment not found' });
      }
      return res.json(docToShipment(doc));
    }

    if (req.method === 'PATCH') {
      const oldDoc = await ShipmentModel.findById(id);
      if (!oldDoc) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      let updateData = req.body;
      if (updateData.documents && Array.isArray(updateData.documents)) {
        updateData.documents = updateData.documents.map((doc: any) => ({
          id: doc.id || Math.random().toString(36).substr(2, 9),
          name: doc.name || 'Untitled Document',
          file: doc.file,
          createdAt: doc.createdAt || Date.now(),
        }));
      }

      const doc = await ShipmentModel.findByIdAndUpdate(
        id,
        { $set: { ...updateData, lastUpdated: Date.now() } },
        { new: true, runValidators: true }
      );

      if (oldDoc) {
        const summaryMap: Record<string, string> = {
          'customTasks': 'Modified custom tasks',
          'shipmentChecklist': 'Modified todo list',
          'checklist': 'Modified checklist',
          'documents': 'Modified documents',
          'details': 'Updated shipment details',
          'commercial': 'Updated commercial details',
          'actual': 'Updated actual details',
          'shipmentType': 'Changed shipment type',
          'manualForwarderName': 'Changed forwarder',
          'manualFumigationName': 'Changed fumigation provider',
        };

        for (const [key, newVal] of Object.entries(updateData)) {
          const oldVal = (oldDoc as any)[key];
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            await AuditLogModel.create({
              shipmentId: id as string,
              action: 'update',
              fieldName: key,
              oldValue: JSON.stringify(oldVal),
              newValue: JSON.stringify(newVal),
              summary: summaryMap[key] || `Updated ${key}`,
              timestamp: Date.now(),
            });
          }
        }
      }

      return res.json(docToShipment(doc));
    }

    if (req.method === 'DELETE') {
      const result = await ShipmentModel.findByIdAndDelete(id);
      if (!result) {
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
