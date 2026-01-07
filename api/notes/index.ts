import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../lib/db';
import { notes } from '../../shared/schema';
import { desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const result = await db.select().from(notes).orderBy(desc(notes.createdAt));
      return res.json(result);
    }

    if (req.method === 'POST') {
      const data = req.body;
      const [inserted] = await db.insert(notes).values({
        ...data,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      }).returning();
      return res.status(201).json(inserted);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
