import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectMongoDB, ContactModel } from '../lib/mongodb';

function docToContact(doc: any) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    name: obj.name,
    details: obj.details,
    createdAt: obj.createdAt,
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

    if (req.method === 'PATCH') {
      const doc = await ContactModel.findByIdAndUpdate(id, req.body, { new: true });
      if (!doc) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      return res.json(docToContact(doc));
    }

    if (req.method === 'DELETE') {
      const result = await ContactModel.findByIdAndDelete(id);
      if (!result) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
