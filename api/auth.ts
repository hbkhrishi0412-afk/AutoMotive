import { VercelRequest, VercelResponse } from '@vercel/node';

const reasonMessage = 'Database functionality is disabled.';
const errorMessage = { success: false, reason: reasonMessage };

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    // For all auth actions, return a service unavailable error because @vercel/postgres is uninstalled.
    return res.status(503).json(errorMessage);
  } catch (error) {
    console.error('API Auth Error (DB disabled):', error);
    return res.status(500).json({ success: false, reason: 'An unexpected server error occurred.' });
  }
}