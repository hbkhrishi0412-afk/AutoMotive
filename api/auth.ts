
import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../lib/db.js';
import User from '../models/User.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
      return res.status(405).json({ success: false, reason: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    const { action, email, password, role, name, mobile } = req.body;

    if (action === 'login') {
        if (!email || !password) {
            return res.status(400).json({ success: false, reason: 'Email and password are required.' });
        }
        // NOTE: In a real app, you would compare a hashed password.
        const user = await User.findOne({ email, password }).lean();

        if (!user) {
            return res.status(401).json({ success: false, reason: 'Invalid credentials.' });
        }
        if (role && user.role !== role) {
            return res.status(403).json({ success: false, reason: `User is not a registered ${role}.` });
        }
        if (user.status === 'inactive') {
            return res.status(403).json({ success: false, reason: 'Your account has been deactivated.' });
        }

        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({ success: true, user: userWithoutPassword });

    } else if (action === 'register') {
        if (!email || !password || !name || !mobile || !role) {
            return res.status(400).json({ success: false, reason: 'All fields are required for registration.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, reason: 'An account with this email already exists.' });
        }

        const newUserDoc = {
            email,
            password, // NOTE: In a real app, hash the password before saving!
            name,
            mobile,
            role,
            status: 'active',
            avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
            subscriptionPlan: role === 'seller' ? 'free' : undefined,
            featuredCredits: role === 'seller' ? 0 : undefined,
            usedCertifications: role === 'seller' ? 0 : undefined,
        };

        const newUser = await User.create(newUserDoc);

        const { password: _, ...userWithoutPassword } = newUser.toObject();
        return res.status(201).json({ success: true, user: userWithoutPassword });

    } else {
        return res.status(400).json({ success: false, reason: 'Invalid action specified.' });
    }
  } catch (error) {
    console.error('API Auth Error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return res.status(500).json({ success: false, reason: message });
  }
}