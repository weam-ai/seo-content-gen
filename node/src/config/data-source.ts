import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
// Get MongoDB URI from environment variable if available, otherwise construct it
const mongoUri = process.env.MONOGODB_URI || `${process.env.DB_CONNECTION}://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_DATABASE}`;
/**
 * Establishes connection to MongoDB database
 * Uses mongoose as ODM (Object Document Mapper)
 * Exits process if connection fails
 */
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit process with failure code
  }
};

// Export the connection function and mongoose instance
export default connectToMongoDB;
export { mongoose };
