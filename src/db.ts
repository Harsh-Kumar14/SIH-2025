const { MongoClient } = require("mongodb");

// Replace the uri string with your connection string
const uri = "mongodb+srv://hraj98097_db_user:pbL3F2UDbnxHzKyz@doctor-details.q8vf2ol.mongodb.net/";

const client = new MongoClient(uri);

export { client };