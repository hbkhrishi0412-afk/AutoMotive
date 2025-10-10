import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/automotive';
const DB_NAME = 'automotive'; // Replace with your MongoDB database name

let client: MongoClient;
let db: Db;

export const connectToMongoDB = async () => {
  if (db) return db;

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

export const getDb = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectToMongoDB first.');
  }
  return db;
};

export const closeMongoDBConnection = async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed.');
  }
};
