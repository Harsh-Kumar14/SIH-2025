const { MongoClient } = require("mongodb");
import dotenv from 'dotenv';

dotenv.config();

// Get the database URI from environment variables
const uri = process.env.DATABASE_URI || process.env.DATABASE_URL;

if (!uri) {
  throw new Error('DATABASE_URI or DATABASE_URL environment variable is required');
}

const client = new MongoClient(uri);

export { client };