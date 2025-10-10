
import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../lib/db';
import mongoose from 'mongoose';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    await connectToDatabase();
    if (mongoose.connection.readyState === 1) {
      res.status(200).json({ status: 'ok', message: 'Database connected successfully.' });
    } else {
      res.status(503).json({ status: 'error', message: 'Database connection failed.' });
    }
  } catch (error) {
    console.error('Error in db-health endpoint:', error);
    res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'An unexpected error occurred.' });
  }
}
