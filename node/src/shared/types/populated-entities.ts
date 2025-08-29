import { Types } from 'mongoose';
import { Article } from '@modules/article/entities/article.entity';
import { Project } from '@modules/projects/entities/projects.entity';

// Local User type definition (original entity was deleted)
export interface User {
  _id?: Types.ObjectId;
  id?: string;
  name?: string;
  email?: string;
}

// Simplified User interface for single-user application
export interface PopulatedUser extends User {
  _id: Types.ObjectId;
}

// Interface for Article with populated fields
export interface PopulatedArticle extends Omit<Article, 'user' | 'project' | '_id'> {
  _id: Types.ObjectId;
  user?: PopulatedUser;
  project?: Project & { _id: Types.ObjectId };
  // Removed assigned_members field
}

// Interface for Project with populated fields
export interface PopulatedProject extends Omit<Project, 'user' | '_id'> {
  _id: Types.ObjectId;
  user?: PopulatedUser;
  // Removed assigned_members field
}

// Type for user ID that can be string or ObjectId
export type UserIdType = string | Types.ObjectId;

// Helper function to convert user ID to ObjectId
export function toObjectId(id: UserIdType): Types.ObjectId {
  return typeof id === 'string' ? new Types.ObjectId(id) : id;
}

// Helper function to get user ID as string
export function getUserId(user: User | PopulatedUser): string {
  return user._id?.toString() || '';
}