import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    res.status(503).json({ status: 'error', message: 'Database functionality is disabled.' });
  } catch (error) {
    console.error('Error in db-health endpoint:', error);
    res.status(500).json({ status: 'error', message: 'An unexpected error occurred.' });
  }
}