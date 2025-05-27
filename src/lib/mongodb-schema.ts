// This file is for reference only - it shows the MongoDB schema design
import { ObjectId } from 'mongodb';

/**
 * User Collection Schema
 * Extends the default schema provided by NextAuth.js
 */
interface User {
  _id: ObjectId;
  name: string;
  email: string;
  emailVerified?: Date;
  image?: string;
  
  // Custom fields
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  postalCode?: string;
  occupation?: string;
  binsReported: number;
  binsUtilized: number;
  totalEcoCoins: number;
  totalCoupons: number;
  badge: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * BinReport Collection Schema
 */
interface BinReport {
  _id: ObjectId;
  userId: ObjectId;
  location: {
    type: 'Point',
    coordinates: [number, number]; // [longitude, latitude]
  };
  address?: string;
  binType: string;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  verifiedBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Reward Collection Schema
 */
interface Reward {
  _id: ObjectId;
  userId: ObjectId;
  type: 'bin-report' | 'bin-use' | 'other';
  amount: number;
  description: string;
  createdAt: Date;
}

/**
 * Coupon Collection Schema
 */
interface Coupon {
  _id: ObjectId;
  userId: ObjectId;
  code: string;
  provider: string;
  discount: string;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
  redeemedAt?: Date;
}