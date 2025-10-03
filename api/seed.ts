import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { MOCK_USERS } from '../constants';
import { MOCK_VEHICLES } from '../constants';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        name TEXT NOT NULL,
        email TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        mobile TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "isVerified" BOOLEAN DEFAULT false,
        "dealershipName" TEXT,
        bio TEXT,
        "logoUrl" TEXT,
        "subscriptionPlan" TEXT,
        "featuredCredits" INTEGER
      );
    `;
    console.log('Created "users" table');

    // Insert users
    await Promise.all(
        MOCK_USERS.map(user => sql`
            INSERT INTO users (name, email, password, mobile, role, status, "createdAt", "isVerified", "dealershipName", bio, "logoUrl", "subscriptionPlan", "featuredCredits")
            VALUES (${user.name}, ${user.email}, ${user.password}, ${user.mobile}, ${user.role}, ${user.status}, ${user.createdAt}, ${user.isVerified || false}, ${user.dealershipName}, ${user.bio}, ${user.logoUrl}, ${user.subscriptionPlan}, ${user.featuredCredits})
            ON CONFLICT (email) DO NOTHING;
        `)
    );
    console.log(`Seeded ${MOCK_USERS.length} users`);

    // Create vehicles table
    await sql`
      CREATE TABLE IF NOT EXISTS vehicles (
        id BIGINT PRIMARY KEY,
        category TEXT,
        make TEXT,
        model TEXT,
        variant TEXT,
        year INTEGER,
        price NUMERIC,
        mileage INTEGER,
        images TEXT[],
        features TEXT[],
        description TEXT,
        "sellerEmail" TEXT REFERENCES users(email),
        engine TEXT,
        transmission TEXT,
        "fuelType" TEXT,
        "fuelEfficiency" TEXT,
        color TEXT,
        status TEXT,
        "isFeatured" BOOLEAN,
        views INTEGER,
        "inquiriesCount" INTEGER,
        "registrationYear" INTEGER,
        "insuranceValidity" TEXT,
        "insuranceType" TEXT,
        rto TEXT,
        city TEXT,
        state TEXT,
        "noOfOwners" INTEGER,
        displacement TEXT,
        "groundClearance" TEXT,
        "bootSpace" TEXT,
        "certifiedInspection" JSONB,
        "videoUrl" TEXT,
        "serviceRecords" JSONB,
        "accidentHistory" JSONB,
        documents JSONB
      );
    `;
    console.log('Created "vehicles" table');

    // Insert vehicles
    await Promise.all(
        MOCK_VEHICLES.map(v => sql`
            INSERT INTO vehicles (id, category, make, model, variant, year, price, mileage, images, features, description, "sellerEmail", engine, transmission, "fuelType", "fuelEfficiency", color, status, "isFeatured", views, "inquiriesCount", "registrationYear", "insuranceValidity", "insuranceType", rto, city, state, "noOfOwners", displacement, "groundClearance", "bootSpace", "certifiedInspection", "videoUrl", "serviceRecords", "accidentHistory", documents)
            VALUES (${v.id}, ${v.category}, ${v.make}, ${v.model}, ${v.variant}, ${v.year}, ${v.price}, ${v.mileage}, ${v.images}, ${v.features}, ${v.description}, ${v.sellerEmail}, ${v.engine}, ${v.transmission}, ${v.fuelType}, ${v.fuelEfficiency}, ${v.color}, ${v.status}, ${v.isFeatured}, ${v.views}, ${v.inquiriesCount}, ${v.registrationYear}, ${v.insuranceValidity}, ${v.insuranceType}, ${v.rto}, ${v.city}, ${v.state}, ${v.noOfOwners}, ${v.displacement}, ${v.groundClearance}, ${v.bootSpace}, ${v.certifiedInspection ? JSON.stringify(v.certifiedInspection) : null}, ${v.videoUrl}, ${v.serviceRecords ? JSON.stringify(v.serviceRecords) : null}, ${v.accidentHistory ? JSON.stringify(v.accidentHistory) : null}, ${v.documents ? JSON.stringify(v.documents) : null})
            ON CONFLICT (id) DO NOTHING;
        `)
    );
    console.log(`Seeded ${MOCK_VEHICLES.length} vehicles`);

    return response.status(200).json({ message: 'Database seeded successfully!' });
  } catch (error) {
    console.error('Error seeding database:', error);
    return response.status(500).json({ error });
  }
}
