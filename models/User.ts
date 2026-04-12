import mongoose, { Schema, Document } from 'mongoose';
import type { IUser, UserRole } from '@/types';

export interface UserDocument extends Omit<IUser, '_id'>, Document {}

const UserSchema = new Schema<UserDocument>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['admin', 'doctor', 'nurse', 'lab-tech', 'pharmacist', 'receptionist', 'billing'] as UserRole[],
      required: true,
    },
    department: { type: String, default: '' },
    hospital: { type: Schema.Types.ObjectId, ref: 'Hospital', default: null },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);
