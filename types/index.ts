import { Types } from 'mongoose';

// ──────────────────────────────────────────
// User / Auth
// ──────────────────────────────────────────
export type UserRole =
  | 'admin'
  | 'doctor'
  | 'nurse'
  | 'lab-tech'
  | 'pharmacist'
  | 'receptionist'
  | 'billing';

export interface IUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  hospital: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────
// Hospital
// ──────────────────────────────────────────
export interface IHospital {
  _id: Types.ObjectId;
  name: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────
// Intake / Triage (Reception Phase)
// ──────────────────────────────────────────
export interface IIntakeVitals {
  weight: string;
  bloodPressure: string;
}

export interface IIntakeQuestion {
  question: string;
  answer: string;
}

export interface IIntake {
  vitals: IIntakeVitals;
  questions: IIntakeQuestion[];
  takenBy: Types.ObjectId;
  takenAt: Date;
}

// ──────────────────────────────────────────
// Patient
// ──────────────────────────────────────────
export type PatientCategory = 'outpatient' | 'hospitalized' | 'external' | 'emergency';
export type PatientStatus = 'active' | 'discharged' | 'deceased';

export interface IAddress {
  street: string;
  city: string;
  region: string;
  postalCode: string;
}

export interface IEmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface IInsuranceInfo {
  provider: string;
  policyNumber: string;
}

export interface IPatient {
  _id: Types.ObjectId;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  phone: string;
  email: string;
  address: IAddress;
  insuranceInfo: IInsuranceInfo;
  emergencyContact: IEmergencyContact;
  category: PatientCategory;
  status: PatientStatus;
  hospital: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId;
}

// ──────────────────────────────────────────
// Appointment
// ──────────────────────────────────────────
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in-preparation'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export interface IAppointment {
  _id: Types.ObjectId;
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  department: string;
  dateTime: Date;
  duration: number;
  reason: string;
  status: AppointmentStatus;
  notes: string;
  hospital: Types.ObjectId | null;
  intake: IIntake | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId;
}

// ──────────────────────────────────────────
// Medical Record (DME)
// ──────────────────────────────────────────
export type RecordType = 'consultation' | 'diagnosis' | 'treatment' | 'vitals' | 'prescription';

export interface IVitals {
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  weight: string;
  height: string;
}

export interface IPrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface IRecordContent {
  chiefComplaint: string;
  examination: string;
  diagnosis: string;
  treatmentPlan: string;
  vitals: IVitals;
  prescriptions: IPrescriptionItem[];
  notes: string;
}

export interface IRecordAttachment {
  type: 'lab' | 'imaging';
  refId: Types.ObjectId;
}

export interface IMedicalRecord {
  _id: Types.ObjectId;
  recordId: string;
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  type: RecordType;
  content: IRecordContent;
  attachments: IRecordAttachment[];
  hospital: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────
// Lab Request (LIS)
// ──────────────────────────────────────────
export type LabStatus = 'requested' | 'sample-collected' | 'in-progress' | 'completed' | 'validated';
export type ResultFlag = 'normal' | 'abnormal' | 'critical';

export interface ILabTest {
  name: string;
  category: string;
}

export interface ILabResult {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: ResultFlag;
}

export interface ILabRequest {
  _id: Types.ObjectId;
  requestId: string;
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  tests: ILabTest[];
  status: LabStatus;
  results: ILabResult[];
  validatedBy: Types.ObjectId | null;
  validatedAt: Date | null;
  notes: string;
  hospital: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────
// Imaging Study (PACS)
// ──────────────────────────────────────────
export type ImagingType = 'xray' | 'ultrasound' | 'ct' | 'mri' | 'echocardiography' | 'other';
export type ImagingStatus = 'requested' | 'scheduled' | 'completed' | 'archived';

export interface IImagingAttachment {
  fileName: string;
  url: string;
}

export interface IImagingStudy {
  _id: Types.ObjectId;
  studyId: string;
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  type: ImagingType;
  bodyPart: string;
  status: ImagingStatus;
  report: string;
  attachments: IImagingAttachment[];
  notes: string;
  hospital: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────
// Pharmacy
// ──────────────────────────────────────────
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export interface IPharmacyItem {
  _id: Types.ObjectId;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  supplier: string;
  expiryDate: Date;
  unitPrice: number;
  status: StockStatus;
  hospital: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDispensationItem {
  pharmacyItem: Types.ObjectId;
  quantity: number;
}

export interface IDispensation {
  _id: Types.ObjectId;
  patient: Types.ObjectId;
  prescription: Types.ObjectId;
  items: IDispensationItem[];
  dispensedBy: Types.ObjectId;
  dispensedAt: Date;
}

// ──────────────────────────────────────────
// Billing / Invoice
// ──────────────────────────────────────────
export type InvoiceStatus = 'unpaid' | 'partially-paid' | 'paid';
export type PaymentMethod = 'cash' | 'check' | 'insurance' | 'bank-transfer';
export type InvoiceItemCategory = 'consultation' | 'lab' | 'imaging' | 'pharmacy' | 'procedure';

export interface IInvoiceItem {
  description: string;
  category: InvoiceItemCategory;
  amount: number;
  refId?: Types.ObjectId;
}

export interface IPayment {
  amount: number;
  method: PaymentMethod;
  paidAt: Date;
  notes: string;
}

export interface IInvoice {
  _id: Types.ObjectId;
  invoiceId: string;
  patient: Types.ObjectId;
  items: IInvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  payments: IPayment[];
  notes: string;
  hospital: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId;
}

// ──────────────────────────────────────────
// Alert
// ──────────────────────────────────────────
export type AlertType = 'error' | 'warning' | 'info';
export type AlertModule = 'pharmacy' | 'lab' | 'imaging' | 'system' | 'billing';

export interface IAlert {
  _id: Types.ObjectId;
  type: AlertType;
  title: string;
  message: string;
  module: AlertModule;
  isRead: boolean;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt: Date | null;
}

// ──────────────────────────────────────────
// Activity Log
// ──────────────────────────────────────────
export type ActivityModule =
  | 'patient'
  | 'appointment'
  | 'lab'
  | 'imaging'
  | 'pharmacy'
  | 'billing'
  | 'record';

export interface IActivityLog {
  _id: Types.ObjectId;
  action: string;
  module: ActivityModule;
  details: string;
  user: Types.ObjectId;
  refId?: Types.ObjectId;
  color: string;
  createdAt: Date;
}

// ──────────────────────────────────────────
// API Response
// ──────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}
