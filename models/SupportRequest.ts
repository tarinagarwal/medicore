import mongoose, { Schema, Document } from 'mongoose';

export interface SupportRequestDocument extends Document {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'closed';
  adminNotes: string;
  resolvedBy: mongoose.Types.ObjectId | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SupportRequestSchema = new Schema<SupportRequestDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved', 'closed'],
      default: 'pending',
    },
    adminNotes: { type: String, default: '' },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.SupportRequest || mongoose.model<SupportRequestDocument>('SupportRequest', SupportRequestSchema);
