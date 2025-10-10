import { db } from './config';
import { MOCK_USERS, MOCK_VEHICLES, MOCK_FAQS } from '../constants';

export const seedDatabase = () => {
  try {
    // Clear existing data
    db.exec('DELETE FROM vehicles');
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM faqs');
    db.exec('DELETE FROM support_tickets');
    db.exec('DELETE FROM notifications');
    db.exec('DELETE FROM audit_logs');
    db.exec('DELETE FROM conversations');
    db.exec('DELETE FROM settings');
    db.exec('DELETE FROM vehicle_data');

    // Insert users
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password, mobile, role, status, createdAt, isVerified, dealershipName, bio, logoUrl, subscriptionPlan, featuredCredits)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    MOCK_USERS.forEach(user => {
      insertUser.run(
        user.name,
        user.email,
        user.password,
        user.mobile,
        user.role,
        user.status,
        user.createdAt,
        user.isVerified ? 1 : 0,
        user.dealershipName || null,
        user.bio || null,
        user.logoUrl || null,
        user.subscriptionPlan || null,
        user.featuredCredits || 0
      );
    });

    console.log(`Seeded ${MOCK_USERS.length} users`);

    // Insert vehicles
    const insertVehicle = db.prepare(`
      INSERT INTO vehicles (
        id, category, make, model, variant, year, price, mileage, images, features, description,
        sellerEmail, engine, transmission, fuelType, fuelEfficiency, color, status, isFeatured,
        views, inquiriesCount, registrationYear, insuranceValidity, insuranceType, rto, city, state,
        noOfOwners, displacement, groundClearance, bootSpace, certifiedInspection, videoUrl,
        serviceRecords, accidentHistory, documents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    MOCK_VEHICLES.forEach(vehicle => {
      insertVehicle.run(
        vehicle.id,
        vehicle.category,
        vehicle.make,
        vehicle.model,
        vehicle.variant,
        vehicle.year,
        vehicle.price,
        vehicle.mileage,
        JSON.stringify(vehicle.images),
        JSON.stringify(vehicle.features),
        vehicle.description,
        vehicle.sellerEmail,
        vehicle.engine,
        vehicle.transmission,
        vehicle.fuelType,
        vehicle.fuelEfficiency,
        vehicle.color,
        vehicle.status,
        vehicle.isFeatured ? 1 : 0,
        vehicle.views || 0,
        vehicle.inquiriesCount || 0,
        vehicle.registrationYear,
        vehicle.insuranceValidity,
        vehicle.insuranceType,
        vehicle.rto,
        vehicle.city,
        vehicle.state,
        vehicle.noOfOwners,
        vehicle.displacement,
        vehicle.groundClearance,
        vehicle.bootSpace,
        vehicle.certifiedInspection ? JSON.stringify(vehicle.certifiedInspection) : null,
        vehicle.videoUrl,
        vehicle.serviceRecords ? JSON.stringify(vehicle.serviceRecords) : null,
        vehicle.accidentHistory ? JSON.stringify(vehicle.accidentHistory) : null,
        vehicle.documents ? JSON.stringify(vehicle.documents) : null
      );
    });

    console.log(`Seeded ${MOCK_VEHICLES.length} vehicles`);

    // Insert FAQs
    const insertFAQ = db.prepare(`
      INSERT INTO faqs (question, answer, category)
      VALUES (?, ?, ?)
    `);

    MOCK_FAQS.forEach(faq => {
      insertFAQ.run(faq.question, faq.answer, faq.category);
    });

    console.log(`Seeded ${MOCK_FAQS.length} FAQs`);

    // Insert default settings
    const insertSetting = db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
    `);

    const defaultSettings = [
      ['theme', 'light'],
      ['notifications', 'true'],
      ['email_notifications', 'true'],
      ['sms_notifications', 'false'],
      ['maintenance_mode', 'false']
    ];

    defaultSettings.forEach(([key, value]) => {
      insertSetting.run(key, value);
    });

    console.log('Seeded default settings');

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}
