import { Document, Types } from 'mongoose';
import type { IUser } from '../users/user.types.js';

// Image interface (for front, back, and userPhoto)
export interface IImage {
  public_id: string;
  url: string;
}

// Image fields for ID front and back
export interface IIdImages {
  front: IImage;
  back: IImage;
}

// Enum for ID types
export type IdType = 'pwd' | 'senior';

// Enum for disability types
export type DisabilityType = 'visual' | 'hearing' | 'physical' | 'mental' | 'multiple';

// Main Eligible interface
export interface IEligible extends Document {
  user: Types.ObjectId | string;
  idNumber: string;
  idType: IdType;
  dateIssued: Date;
  expiryDate?: Date; // Optional for senior citizen
  idImage: IIdImages;
  typeOfDisability: DisabilityType | null;
  userPhoto: IImage;
  isVerified: boolean;
  verifiedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create interface (omitting auto-generated fields)
export interface IEligibleCreate {
  user: Types.ObjectId | string;
  idNumber: string;
  idType?: IdType; // Default: 'pwd'
  dateIssued: Date;
  expiryDate?: Date;
  idImage: IIdImages;
  typeOfDisability?: DisabilityType | null; // Default: null
  userPhoto: IImage;
  isVerified?: boolean; // Default: false
  verifiedAt?: Date | null; // Default: null
}

// Update interface (all fields optional)
export interface IEligibleUpdate extends Partial<IEligibleCreate> {}

// Query interface for filtering
export interface IEligibleQuery {
  user?: Types.ObjectId | string;
  idNumber?: string;
  idType?: IdType;
  isVerified?: boolean;
  dateIssued?: Date;
  expiryDate?: Date;
  typeOfDisability?: DisabilityType | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Validation result interface
export interface IEligibleValidationResult {
  isValid: boolean;
  errors?: string[];
}

// Population interface (when user is populated)
export interface IEligiblePopulated extends Omit<IEligible, 'user'> {
  user: IUser;
}

// For lean queries (plain JavaScript objects)
export type IEligibleLean = Omit<IEligible, keyof Document>;

// For API responses
export interface IEligibleResponse {
  success: boolean;
  data?: IEligible | IEligible[] | null;
  message?: string;
  error?: string;
}

// For paginated responses
export interface IEligiblePaginatedResponse {
  data: IEligible[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}