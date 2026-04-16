import mongoose, { Schema, Document } from 'mongoose';
import type { IMedicalRecord } from '@/types';

export interface MedicalRecordDocument extends Omit<IMedicalRecord, '_id'>, Document {}

const MedicalRecordSchema = new Schema<MedicalRecordDocument>(
  {
    recordId: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['consultation', 'diagnosis', 'treatment', 'vitals', 'prescription'],
      required: true,
    },
    content: {
      chiefComplaint: { type: String, default: '' },
      examination: { type: String, default: '' },
      diagnosis: { type: String, default: '' },
      treatmentPlan: { type: String, default: '' },
      vitals: {
        bloodPressure: { type: String, default: '' },
        heartRate: { type: String, default: '' },
        temperature: { type: String, default: '' },
        weight: { type: String, default: '' },
        height: { type: String, default: '' },
      },
      prescriptions: [{
        medication: String,
        dosage: String,
        frequency: String,
        duration: String,
      }],
      notes: { type: String, default: '' },
    },
    attachments: [{
      type: { type: String, enum: ['lab', 'imaging'] },
      refId: { type: Schema.Types.ObjectId },
    }],
    hospital: { type: Schema.Types.ObjectId, ref: 'Hospital', default: null },
  },
  { timestamps: true }
);

export default mongoose.models.MedicalRecord || mongoose.model<MedicalRecordDocument>('MedicalRecord', MedicalRecordSchema);
