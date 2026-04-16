import mongoose, { Schema, Document } from 'mongoose';
import type { ILabRequest } from '@/types';

export interface LabRequestDocument extends Omit<ILabRequest, '_id'>, Document {}

const LabRequestSchema = new Schema<LabRequestDocument>(
  {
    requestId: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tests: [{ name: String, category: String }],
    status: {
      type: String,
      enum: ['requested', 'sample-collected', 'in-progress', 'completed', 'validated'],
      default: 'requested',
    },
    results: [{
      testName: String,
      value: String,
      unit: String,
      referenceRange: String,
      flag: { type: String, enum: ['normal', 'abnormal', 'critical'], default: 'normal' },
    }],
    validatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    validatedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
    hospital: { type: Schema.Types.ObjectId, ref: 'Hospital', default: null },
  },
  { timestamps: true }
);

export default mongoose.models.LabRequest || mongoose.model<LabRequestDocument>('LabRequest', LabRequestSchema);
