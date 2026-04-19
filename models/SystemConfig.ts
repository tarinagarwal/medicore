import mongoose, { Schema, Document } from 'mongoose';

export interface SystemConfigDocument extends Document {
  key: string;
  label: string;
  values: string[] | Record<string, string[]>; // Support both flat arrays and nested objects
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SystemConfigSchema = new Schema<SystemConfigDocument>(
  {
    key: { 
      type: String, 
      required: true, 
      unique: true,
      enum: ['departments', 'labCategories', 'imagingTypes', 'labTests']
    },
    label: { type: String, required: true },
    values: { type: Schema.Types.Mixed }, // Allow both arrays and objects
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.SystemConfig || mongoose.model<SystemConfigDocument>('SystemConfig', SystemConfigSchema);
