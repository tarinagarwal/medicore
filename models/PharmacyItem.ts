import mongoose, { Schema, Document } from 'mongoose';
import type { IPharmacyItem } from '@/types';

export interface PharmacyItemDocument extends Omit<IPharmacyItem, '_id'>, Document {}

const PharmacyItemSchema = new Schema<PharmacyItemDocument>(
  {
    name: { type: String, required: true },
    category: { type: String, default: '' },
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: '' },
    minThreshold: { type: Number, default: 10 },
    supplier: { type: String, default: '' },
    expiryDate: { type: Date },
    unitPrice: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['in-stock', 'low-stock', 'out-of-stock'],
      default: 'in-stock',
    },
    hospital: { type: Schema.Types.ObjectId, ref: 'Hospital', default: null },
  },
  { timestamps: true }
);

export default mongoose.models.PharmacyItem || mongoose.model<PharmacyItemDocument>('PharmacyItem', PharmacyItemSchema);
