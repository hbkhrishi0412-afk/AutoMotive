
import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../lib/db';
import User from '../models/User';
import Vehicle from '../models/Vehicle';
import { MOCK_USERS, MOCK_VEHICLES } from '../constants';

export default async function handler(
  _request: VercelRequest,
  response: VercelResponse,
) {
  try {
    await connectToDatabase();
    console.log('Seeding database...');

    // Clear existing data
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    console.log('Cleared existing data.');

    // Insert new data
    // NOTE: In a real app, passwords should be hashed before inserting.
    // For this context, we will insert the mock data as is.
    await User.insertMany(MOCK_USERS);
    await Vehicle.insertMany(MOCK_VEHICLES);
    console.log('Seeded new data.');

    return response.status(200).json({ message: 'Database seeded successfully!' });
  } catch (error) {
    console.error('Error in seed endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return response.status(500).json({ error: 'Failed to seed database.', details: errorMessage });
  }
}
