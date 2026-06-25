import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("ERROR: MONGODB_URI not found in .env file.");
  process.exit(1);
}
console.log("Attempting to connect to MongoDB Atlas...");
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("SUCCESS: Connected to MongoDB Atlas successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("ERROR connecting to MongoDB Atlas:", err.message);
    process.exit(1);
  });
