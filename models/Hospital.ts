import mongoose, { Schema, Document } from 'mongoose';

export interface HospitalDocument extends Document {
  name: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HospitalSchema = new Schema<HospitalDocument>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Hospital || mongoose.model<HospitalDocument>('Hospital', HospitalSchema);
