import { initializeDatabase } from '../database/config';
import { seedDatabase } from '../database/seed';

const initDatabase = async () => {
  try {
    console.log('Initializing database...');
    initializeDatabase();
    
    console.log('Seeding database...');
    seedDatabase();
    
    console.log('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

initDatabase();
