
import type { VercelRequest, VercelResponse } from '@vercel/node';
import client from '../lib/db';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    await client.connect();
    if (client.topology?.isConnected()) {
      res.status(200).json({ status: 'ok', message: 'Database connected successfully.' });
    } else {
      res.status(503).json({ status: 'error', message: 'Database connection failed.' });
    }
  } catch (error) {
    console.error('Error in db-health endpoint:', error);
    res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'An unexpected error occurred.' });
  }
}
