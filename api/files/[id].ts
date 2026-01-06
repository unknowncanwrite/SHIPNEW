import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFileFromDrive, deleteFileFromDrive } from '../lib/google-drive';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'File ID is required' });
  }

  try {
    if (req.method === 'GET') {
      const file = await getFileFromDrive(id);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      return res.send(file.data);
    }

    if (req.method === 'DELETE') {
      await deleteFileFromDrive(id);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('File operation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process file' });
  }
}
