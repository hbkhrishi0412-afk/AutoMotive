import { VercelRequest, VercelResponse } from '@vercel/node';

const errorMessage = { error: 'Database functionality is disabled.' };

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    // For all methods, return a service unavailable error because @vercel/postgres is uninstalled.
    return res.status(503).json(errorMessage);
  } catch (error) {
    console.error('API Vehicles Error (DB disabled):', error);
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
}