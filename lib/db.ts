

import mongoose from 'mongoose';
import type { Mongoose } from 'mongoose';

// Connection caching logic to prevent multiple connections in a serverless environment.
// FIX: Replace 'global' with 'globalThis' for broader environment compatibility.
let cached = (globalThis as any).mongoose;

if (!cached) {
// FIX: Replace 'global' with 'globalThis' for broader environment compatibility.
  cached = (globalThis as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    if (!process.env.MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable.');
    }

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
