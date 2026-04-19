import mongoose, { Schema, Document } from 'mongoose';
import type { IImagingStudy } from '@/types';

export interface ImagingStudyDocument extends Omit<IImagingStudy, '_id'>, Document {}

const ImagingStudySchema = new Schema<ImagingStudyDocument>(
  {
    studyId: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
    },
    bodyPart: { type: String, default: '' },
    status: {
      type: String,
      enum: ['requested', 'scheduled', 'completed', 'archived'],
      default: 'requested',
    },
    report: { type: String, default: '' },
    attachments: [{ fileName: String, url: String }],
    notes: { type: String, default: '' },
    hospital: { type: Schema.Types.ObjectId, ref: 'Hospital', default: null },
  },
  { timestamps: true }
);

export default mongoose.models.ImagingStudy || mongoose.model<ImagingStudyDocument>('ImagingStudy', ImagingStudySchema);
