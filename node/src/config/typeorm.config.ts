import { MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

/**
 * Generates MongoDB connection configuration using environment variables
 * @param configService NestJS Config Service to access environment variables
 * @returns MongooseModuleOptions containing the MongoDB connection URI
 */
export const mongooseConfig = (
  configService: ConfigService,
): MongooseModuleOptions => {
  // Get database connection details from environment variables
  const username = configService.get<string>('DB_USERNAME');
  const password = configService.get<string>('DB_PASSWORD');
  const hostname = configService.get<string>('DB_HOST');
  const port = configService.get<number>('DB_PORT');
  const dbName = configService.get<string>('DB_DATABASE');
  const connection = configService.get<string>('DB_CONNECTION');
  
  // Build URI based on whether authentication is provided
  let uri: string;
  if (username && password) {
    uri = `${connection}://${username}:${password}@${hostname}:/${dbName}`;
  } else {
    uri = `${connection}://${hostname}:/${dbName}`;
  }
  
  return { uri };
};
