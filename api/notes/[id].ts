import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../lib/db';
import { notes } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const noteId = Array.isArray(id) ? id[0] : id;

  if (!noteId) {
    return res.status(400).json({ error: 'Note ID is required' });
  }

  try {
    if (req.method === 'PATCH') {
      const [updated] = await db.update(notes)
        .set(req.body)
        .where(eq(notes.id, noteId))
        .returning();
      if (!updated) {
        return res.status(404).json({ error: 'Note not found' });
      }
      return res.json(updated);
    }

    if (req.method === 'DELETE') {
      const deleted = await db.delete(notes).where(eq(notes.id, noteId)).returning();
      if (deleted.length === 0) {
        return res.status(404).json({ error: 'Note not found' });
      }
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
