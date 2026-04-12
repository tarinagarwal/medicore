import mongoose, { Schema, Document } from 'mongoose';
import type { IPatient } from '@/types';

export interface PatientDocument extends Omit<IPatient, '_id'>, Document {}

const PatientSchema = new Schema<PatientDocument>(
  {
    patientId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      region: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },
    insuranceInfo: {
      provider: { type: String, default: '' },
      policyNumber: { type: String, default: '' },
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: '' },
    },
    category: {
      type: String,
      enum: ['outpatient', 'hospitalized', 'external', 'emergency'],
      default: 'outpatient',
    },
    status: {
      type: String,
      enum: ['active', 'discharged', 'deceased'],
      default: 'active',
    },
    hospital: { type: Schema.Types.ObjectId, ref: 'Hospital', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.Patient || mongoose.model<PatientDocument>('Patient', PatientSchema);
