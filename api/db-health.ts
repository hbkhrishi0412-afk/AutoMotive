import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // This simple query checks if a connection can be established.
    await sql`SELECT 1`;
    res.status(200).json({ status: 'ok', message: 'Database connection is healthy.' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({ status: 'error', message: 'Cannot connect to the database.' });
  }
}