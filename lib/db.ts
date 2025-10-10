import mongoose from 'mongoose';

const uri = process.env.MONGO_URI ?? "mongodb://localhost:27017/reride-app";

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB successfully");
    return mongoose.connection;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export default connectToDatabase;
