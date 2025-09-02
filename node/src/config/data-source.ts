import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Construct MongoDB connection URI using environment variables
const mongoUri = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOSTNAME}:${process.env.DB_PORT ?? '27017'}/${process.env.DB_NAME}`;

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
