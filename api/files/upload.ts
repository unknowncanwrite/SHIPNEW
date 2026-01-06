import type { VercelRequest, VercelResponse } from '@vercel/node';
import { uploadFileToDrive } from '../lib/google-drive';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, mimeType, fileContent, folderId } = req.body;

    if (!fileName || !mimeType || !fileContent) {
      return res.status(400).json({ error: 'Missing required fields: fileName, mimeType, fileContent' });
    }

    const result = await uploadFileToDrive(fileName, mimeType, fileContent, folderId);

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
}
