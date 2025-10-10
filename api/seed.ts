import type { VercelResponse } from '@vercel/node';

export default async function handler(
  _request: any,
  response: VercelResponse,
) {
  try {
    const message = 'Database functionality is disabled as @vercel/postgres has been uninstalled. Cannot seed database.';
    console.log(message);
    return response.status(503).json({ error: message });
  } catch (error) {
    console.error('Error in disabled seed endpoint:', error);
    return response.status(500).json({ error: 'An unexpected error occurred.' });
  }
}
