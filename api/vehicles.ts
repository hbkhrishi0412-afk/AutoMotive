
import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';
import type { User, Vehicle } from '../types';

// Helper function to get user role for authorization
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

    // PUBLIC: Get all vehicles
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM vehicles ORDER BY "isFeatured" DESC, id DESC;`;
      return res.status(200).json(rows);
    }

    // AUTH REQUIRED FOR ALL OTHER METHODS
    if (!userEmail) {
        return res.status(401).json({ error: 'Unauthorized: Missing user email.' });
    }
    const userRole = await getUserRole(userEmail);

    if (req.method === 'POST') {
      if (userRole !== 'seller') {
        return res.status(403).json({ error: 'Forbidden: Only sellers can create listings.' });
      }
      // FIX: The request body contains a full Vehicle object, including the client-generated ID.
      const vehicle = req.body as Vehicle;

      const { rows } = await sql`
        INSERT INTO vehicles (id, category, make, model, variant, year, price, mileage, images, features, description, "sellerEmail", engine, transmission, "fuelType", "fuelEfficiency", color, status, "isFeatured", views, "inquiriesCount", "registrationYear", "insuranceValidity", "insuranceType", rto, city, state, "noOfOwners", displacement, "groundClearance", "bootSpace", "certifiedInspection", "videoUrl", "serviceRecords", "accidentHistory", documents, "certificationStatus")
        VALUES (
          ${vehicle.id}, ${vehicle.category}, ${vehicle.make}, ${vehicle.model}, ${vehicle.variant}, ${vehicle.year}, ${vehicle.price}, ${vehicle.mileage}, ${vehicle.images as any}, 
          ${vehicle.features as any}, ${vehicle.description}, ${userEmail}, ${vehicle.engine}, ${vehicle.transmission}, ${vehicle.fuelType}, ${vehicle.fuelEfficiency}, 
          ${vehicle.color}, ${vehicle.status}, ${vehicle.isFeatured}, ${vehicle.views}, ${vehicle.inquiriesCount}, ${vehicle.registrationYear}, ${vehicle.insuranceValidity}, 
          ${vehicle.insuranceType}, ${vehicle.rto}, ${vehicle.city}, ${vehicle.state}, ${vehicle.noOfOwners}, ${vehicle.displacement}, ${vehicle.groundClearance}, 
          ${vehicle.bootSpace}, ${vehicle.certifiedInspection ? JSON.stringify(vehicle.certifiedInspection) : null}, ${vehicle.videoUrl}, 
          ${vehicle.serviceRecords ? JSON.stringify(vehicle.serviceRecords) : null}, ${vehicle.accidentHistory ? JSON.stringify(vehicle.accidentHistory) : null}, 
          ${vehicle.documents ? JSON.stringify(vehicle.documents) : null}, ${vehicle.certificationStatus}
        )
        RETURNING *;
      `;
      return res.status(201).json(rows[0]);
    }
    
    if (req.method === 'PUT') {
        const vehicle = req.body as Vehicle;
        
        // Authorization: Check if user is owner or admin
        const { rows: ownerCheck } = await sql`SELECT "sellerEmail" FROM vehicles WHERE id = ${vehicle.id}`;
        if (ownerCheck.length === 0) {
            return res.status(404).json({ error: 'Vehicle not found.' });
        }
        if (ownerCheck[0].sellerEmail !== userEmail && userRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: You do not own this listing.' });
        }
        
        // Update vehicle in database
        const { rows } = await sql`
            UPDATE vehicles
            SET 
                category = ${vehicle.category}, make = ${vehicle.make}, model = ${vehicle.model}, variant = ${vehicle.variant}, year = ${vehicle.year}, price = ${vehicle.price}, 
                mileage = ${vehicle.mileage}, images = ${vehicle.images as any}, features = ${vehicle.features as any}, description = ${vehicle.description}, engine = ${vehicle.engine}, 
                transmission = ${vehicle.transmission}, "fuelType" = ${vehicle.fuelType}, "fuelEfficiency" = ${vehicle.fuelEfficiency}, color = ${vehicle.color}, status = ${vehicle.status}, 
                "isFeatured" = ${vehicle.isFeatured}, views = ${vehicle.views}, "inquiriesCount" = ${vehicle.inquiriesCount}, "registrationYear" = ${vehicle.registrationYear}, 
                "insuranceValidity" = ${vehicle.insuranceValidity}, "insuranceType" = ${vehicle.insuranceType}, rto = ${vehicle.rto}, city = ${vehicle.city}, state = ${vehicle.state}, 
                "noOfOwners" = ${vehicle.noOfOwners}, displacement = ${vehicle.displacement}, "groundClearance" = ${vehicle.groundClearance}, "bootSpace" = ${vehicle.bootSpace}, 
                "certifiedInspection" = ${vehicle.certifiedInspection ? JSON.stringify(vehicle.certifiedInspection) : null}, "videoUrl" = ${vehicle.videoUrl}, 
                "serviceRecords" = ${vehicle.serviceRecords ? JSON.stringify(vehicle.serviceRecords) : null}, "accidentHistory" = ${vehicle.accidentHistory ? JSON.stringify(vehicle.accidentHistory) : null}, 
                documents = ${vehicle.documents ? JSON.stringify(vehicle.documents) : null}, "certificationStatus" = ${vehicle.certificationStatus}
            WHERE id = ${vehicle.id}
            RETURNING *;
        `;
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Vehicle not found or no changes were made.' });
        }
        return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ error: 'Vehicle ID is required.' });
        }

        // Authorization: Check if user is owner or admin
        const { rows: ownerCheck } = await sql`SELECT "sellerEmail" FROM vehicles WHERE id = ${id}`;
        if (ownerCheck.length === 0) {
             return res.status(404).json({ error: 'Vehicle not found.' });
        }
        if (ownerCheck[0].sellerEmail !== userEmail && userRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: You do not own this listing.' });
        }
        
        await sql`DELETE FROM vehicles WHERE id = ${id};`;
        return res.status(200).json({ success: true, id });
    }

    // If no method matches
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  } catch (error) {
    console.error('API Vehicles Error:', error);
    return res.status(500).json({ error: 'Failed to process vehicle request.' });
  }
}
