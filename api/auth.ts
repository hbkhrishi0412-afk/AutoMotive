

import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';
import type { User } from '../types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action, ...credentials } = req.body;

  try {
    if (action === 'login') {
      const { email, password, role } = credentials;
      if (!email || !password) {
        return res.status(400).json({ success: false, reason: 'Email and password are required.' });
      }

      const { rows } = await sql<User>`
        SELECT * FROM users WHERE email = ${email};
      `;
      
      const user = rows[0];

      if (!user || user.password !== password) {
        return res.status(401).json({ success: false, reason: 'Invalid credentials.' });
      }

      if (role && user.role !== role) {
         return res.status(401).json({ success: false, reason: `User is not a registered ${role}. Please check your login portal.` });
      }
      
      if (user.status === 'inactive') {
        return res.status(403).json({ success: false, reason: 'Your account has been deactivated by an administrator.' });
      }
      
      // Do not send password back to client
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({ success: true, user: userWithoutPassword });

    } else if (action === 'register') {
      const { name, email, password, mobile, role } = credentials;
      if (!name || !email || !password || !mobile || !role) {
         return res.status(400).json({ success: false, reason: 'All fields are required for registration.' });
      }

      // Check if user already exists
      const { rowCount } = await sql`SELECT 1 FROM users WHERE email = ${email}`;
      if (rowCount > 0) {
        return res.status(409).json({ success: false, reason: 'An account with this email already exists.' });
      }

      const newUser: User = {
        ...credentials,
        status: 'active',
        createdAt: new Date().toISOString(),
        subscriptionPlan: 'free',
        featuredCredits: 0,
        usedCertifications: 0,
      };

      await sql`
        INSERT INTO users (name, email, password, mobile, role, status, "createdAt", "subscriptionPlan", "featuredCredits", "usedCertifications")
        VALUES (${newUser.name}, ${newUser.email}, ${newUser.password}, ${newUser.mobile}, ${newUser.role}, ${newUser.status}, ${newUser.createdAt}, ${newUser.subscriptionPlan}, ${newUser.featuredCredits}, ${newUser.usedCertifications});
      `;
      
      const { password: _, ...userWithoutPassword } = newUser;
      return res.status(201).json({ success: true, user: userWithoutPassword });

    } else {
      return res.status(400).json({ error: 'Invalid action specified.' });
    }
  } catch (error) {
    console.error('API Auth Error:', error);
    return res.status(500).json({ success: false, reason: 'An internal server error occurred.' });
  }
}