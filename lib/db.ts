import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI ?? "your-mongodb-uri-here"; // Replace with your MongoDB URI or use an environment variable
const client = new MongoClient(uri);

export default client;
