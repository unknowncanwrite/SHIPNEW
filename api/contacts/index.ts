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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectMongoDB();

    if (req.method === 'GET') {
      const docs = await ContactModel.find().sort({ createdAt: -1 });
      return res.json(docs.map(docToContact));
    }

    if (req.method === 'POST') {
      const data = req.body;
      const doc = await ContactModel.create({
        ...data,
        createdAt: Date.now(),
      });
      return res.status(201).json(docToContact(doc));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
