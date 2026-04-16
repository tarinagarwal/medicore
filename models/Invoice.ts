import mongoose, { Schema, Document } from 'mongoose';
import type { IInvoice } from '@/types';

export interface InvoiceDocument extends Omit<IInvoice, '_id'>, Document {}

const InvoiceSchema = new Schema<InvoiceDocument>(
  {
    invoiceId: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    items: [{
      description: String,
      category: { type: String, enum: ['consultation', 'lab', 'imaging', 'pharmacy', 'procedure'] },
      amount: Number,
      refId: { type: Schema.Types.ObjectId },
    }],
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['unpaid', 'partially-paid', 'paid'],
      default: 'unpaid',
    },
    payments: [{
      amount: Number,
      method: { type: String, enum: ['cash', 'check', 'insurance', 'bank-transfer'] },
      paidAt: Date,
      notes: String,
    }],
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    hospital: { type: Schema.Types.ObjectId, ref: 'Hospital', default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Invoice || mongoose.model<InvoiceDocument>('Invoice', InvoiceSchema);
