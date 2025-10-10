
import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../lib/db';
import User from '../models/User';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    await connectToDatabase();

    switch (req.method) {
      case 'GET': {
        const users = await User.find({}).select('-password'); // Exclude password hash
        return res.status(200).json(users);
      }
      case 'PUT': {
        const { email, ...updateData } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required for update.' });
        }
        const updatedUser = await User.findOneAndUpdate({ email }, updateData, { new: true }).select('-password');
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found.' });
        }
        return res.status(200).json(updatedUser);
      }
      case 'DELETE': {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required for deletion.' });
        }
        const result = await User.deleteOne({ email });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        return res.status(200).json({ success: true, email });
      }
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Users Error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return res.status(500).json({ error: message });
  }
}
