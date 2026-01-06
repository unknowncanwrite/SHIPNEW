import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectMongoDB, AuditLogModel } from '../../lib/mongodb';

function docToAuditLog(doc: any) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    shipmentId: obj.shipmentId,
    action: obj.action,
    fieldName: obj.fieldName || null,
    oldValue: obj.oldValue || null,
    newValue: obj.newValue || null,
    summary: obj.summary,
    timestamp: obj.timestamp,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    await connectMongoDB();

    if (req.method === 'GET') {
      const docs = await AuditLogModel.find({ shipmentId: id }).sort({ timestamp: -1 });
      return res.json(docs.map(docToAuditLog));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
