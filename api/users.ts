import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';
import type { User } from '../types.ts';

async function getUserRole(email: string): Promise<User['role'] | null> {
    if (!email) return null;
    const { rows } = await sql<{ role: User['role'] }>`SELECT role FROM users WHERE email = ${email}`;
    return rows.length > 0 ? rows[0].role : null;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const userEmail = req.headers.authorization;

    if (req.method === 'GET') {
      const { rows } = await sql`SELECT name, email, mobile, role, status, "createdAt", "isVerified", "dealershipName", bio, "logoUrl", "subscriptionPlan", "featuredCredits", "usedCertifications" FROM users ORDER BY name ASC;`;
      return res.status(200).json(rows);
    }
    
    // AUTH REQUIRED FOR MUTATIONS
    if (!userEmail) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const requesterRole = await getUserRole(userEmail);

    if (req.method === 'PUT') {
        const userToUpdate = req.body as Partial<User> & { email: string };
        
        // Authorization: User can update themselves, or an admin can update anyone.
        if (userEmail !== userToUpdate.email && requesterRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: You can only update your own profile.' });
        }

        const { email, name, mobile, role, status, dealershipName, bio, logoUrl, subscriptionPlan, featuredCredits, usedCertifications, isVerified, password } = userToUpdate;
        
        // Build the query dynamically to avoid updating all fields
        let query = 'UPDATE users SET ';
        const params: any[] = [];
        let paramIndex = 1;

        if (name) { query += `name = $${paramIndex++}, `; params.push(name); }
        if (mobile) { query += `mobile = $${paramIndex++}, `; params.push(mobile); }
        if (role && requesterRole === 'admin') { query += `role = $${paramIndex++}, `; params.push(role); }
        if (status && requesterRole === 'admin') { query += `status = $${paramIndex++}, `; params.push(status); }
        if (dealershipName) { query += `"dealershipName" = $${paramIndex++}, `; params.push(dealershipName); }
        if (bio) { query += `bio = $${paramIndex++}, `; params.push(bio); }
        if (logoUrl) { query += `"logoUrl" = $${paramIndex++}, `; params.push(logoUrl); }
        if (subscriptionPlan) { query += `"subscriptionPlan" = $${paramIndex++}, `; params.push(subscriptionPlan); }
        if (featuredCredits !== undefined) { query += `"featuredCredits" = $${paramIndex++}, `; params.push(featuredCredits); }
        if (usedCertifications !== undefined) { query += `"usedCertifications" = $${paramIndex++}, `; params.push(usedCertifications); }
        if (isVerified !== undefined && requesterRole === 'admin') { query += `"isVerified" = $${paramIndex++}, `; params.push(isVerified); }
        if (password) { query += `password = $${paramIndex++}, `; params.push(password); }

        // If no fields were provided to update, return a 200 OK with the existing user data.
        if (params.length === 0) {
            const { rows } = await sql`SELECT name, email, mobile, role, status, "createdAt", "isVerified", "dealershipName", bio, "logoUrl", "subscriptionPlan", "featuredCredits", "usedCertifications" FROM users WHERE email = ${email};`;
            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found.' });
            }
            return res.status(200).json(rows[0]);
        }

        query = query.slice(0, -2); // Remove trailing comma and space
        query += ` WHERE email = $${paramIndex++}`;
        params.push(email);

        // Add the RETURNING clause to get the updated user back
        query += ` RETURNING name, email, mobile, role, status, "createdAt", "isVerified", "dealershipName", bio, "logoUrl", "subscriptionPlan", "featuredCredits", "usedCertifications";`;

        const { rows } = await sql.query(query, params);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found or no changes were made.' });
        }
        
        return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
        const { email: emailToDelete } = req.body;
        if (requesterRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Only admins can delete users.' });
        }
        if (emailToDelete === userEmail) {
            return res.status(400).json({ error: 'Admins cannot delete their own account.' });
        }
        
        await sql`DELETE FROM vehicles WHERE "sellerEmail" = ${emailToDelete};`;
        await sql`DELETE FROM users WHERE email = ${emailToDelete};`;
        
        return res.status(200).json({ success: true, email: emailToDelete });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  } catch (error) {
    console.error('API Users Error:', error);
    return res.status(500).json({ error: 'Failed to process user request.' });
  }
}