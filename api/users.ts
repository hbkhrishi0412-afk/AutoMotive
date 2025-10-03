import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    // We select all fields for now to maintain compatibility with client-side logic
    // In a real app, you would OMIT the password field: SELECT name, email, ... FROM users
    const { rows } = await sql`SELECT * FROM users ORDER BY name ASC;`;
    return response.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    return response.status(500).json({ error: 'Failed to fetch users' });
  }
}
