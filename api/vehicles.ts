import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const { rows } = await sql`SELECT * FROM vehicles ORDER BY "isFeatured" DESC, year DESC;`;
    return response.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return response.status(500).json({ error: 'Failed to fetch vehicles' });
  }
}
