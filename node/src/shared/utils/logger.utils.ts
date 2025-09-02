import { createLogger, format, transports } from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import 'winston-daily-rotate-file';
import DailyRotateFile from 'winston-daily-rotate-file';

// Ensure logs directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define daily rotate file transport
const dailyRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'bootstrap-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d', // Keep logs for 14 days
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(
      ({
        timestamp,
        level,
        message,
      }: {
        timestamp: string;
        level: string;
        message: string;
      }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`,
    ),
  ),
});

// Create logger instance
export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(
      ({
        timestamp,
        level,
        message,
      }: {
        timestamp: string;
        level: string;
        message: string;
      }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`,
    ),
  ),
  transports: [new transports.Console(), dailyRotateTransport],
});
