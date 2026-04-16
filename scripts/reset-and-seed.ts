import mongoose from 'mongoose';
import { hash } from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set in .env.local');
  process.exit(1);
}

// ============================================
// STEP 1: DROP DATABASE
// ============================================
async function dropDatabase() {
  console.log('\n🗑️  STEP 1: Clearing database...');
  await mongoose.connect(MONGODB_URI);
  await mongoose.connection.db!.dropDatabase();
  console.log('✅ Database cleared successfully');
  await mongoose.disconnect();
}

// ============================================
// STEP 2: SEED USERS
// ============================================
async function seedUsers() {
  console.log('\n👥 STEP 2: Creating users...');
  await mongoose.connect(MONGODB_URI);

  const UserSchema = new mongoose.Schema(
    {
      firstName: String,
      lastName: String,
      email: { type: String, unique: true, lowercase: true },
      password: { type: String, select: false },
      role: String,
      department: String,
      hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
  );

  const User = mongoose.model('User', UserSchema);

  const users = [
    {
      firstName: 'Admin',
      lastName: 'System',
      email: 'admin@medicore.com',
      password: await hash('admin123', 12),
      role: 'admin',
      department: 'Administration',
    },
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'doctor@medicore.com',
      password: await hash('doctor123', 12),
      role: 'doctor',
      department: 'Cardiology',
    },
    {
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'doctor2@medicore.com',
      password: await hash('doctor123', 12),
      role: 'doctor',
      department: 'Pediatrics',
    },
    {
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'nurse@medicore.com',
      password: await hash('nurse123', 12),
      role: 'nurse',
      department: 'General Care',
    },
    {
      firstName: 'John',
      lastName: 'Smith',
      email: 'lab@medicore.com',
      password: await hash('lab123', 12),
      role: 'lab-tech',
      department: 'Laboratory',
    },
    {
      firstName: 'Lisa',
      lastName: 'Brown',
      email: 'pharmacist@medicore.com',
      password: await hash('pharma123', 12),
      role: 'pharmacist',
      department: 'Pharmacy',
    },
    {
      firstName: 'Emma',
      lastName: 'Wilson',
      email: 'receptionist@medicore.com',
      password: await hash('reception123', 12),
      role: 'receptionist',
      department: 'Reception',
    },
    {
      firstName: 'David',
      lastName: 'Lee',
      email: 'billing@medicore.com',
      password: await hash('billing123', 12),
      role: 'billing',
      department: 'Finance',
    },
  ];

  for (const userData of users) {
    await User.create(userData);
    console.log(`  ✓ ${userData.firstName} ${userData.lastName} (${userData.role}) - ${userData.email}`);
  }

  console.log('\n📧 Login Credentials:');
  console.log('  Admin:        admin@medicore.com / admin123');
  console.log('  Doctor:       doctor@medicore.com / doctor123');
  console.log('  Doctor 2:     doctor2@medicore.com / doctor123');
  console.log('  Nurse:        nurse@medicore.com / nurse123');
  console.log('  Lab Tech:     lab@medicore.com / lab123');
  console.log('  Pharmacist:   pharmacist@medicore.com / pharma123');
  console.log('  Receptionist: receptionist@medicore.com / reception123');
  console.log('  Billing:      billing@medicore.com / billing123');

  await mongoose.disconnect();
}

// ============================================
// STEP 3: SEED DASHBOARD DATA
// ============================================
async function seedDashboard() {
  console.log('\n📊 STEP 3: Creating dashboard data...');
  await mongoose.connect(MONGODB_URI);

  // Define schemas
  const PatientSchema = new mongoose.Schema({
    patientId: { type: String, unique: true },
    firstName: String, lastName: String,
    dateOfBirth: Date, gender: String,
    phone: String, email: String,
    address: { street: String, city: String, region: String, postalCode: String },
    insuranceInfo: { provider: String, policyNumber: String },
    emergencyContact: { name: String, phone: String, relationship: String },
    category: String, status: { type: String, default: 'active' },
    createdBy: mongoose.Schema.Types.ObjectId,
  }, { timestamps: true });

  const AppointmentSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: String, dateTime: Date, duration: Number,
    reason: String, status: String, notes: String,
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
    intake: {
      vitals: { weight: String, bloodPressure: String },
      questions: [{ question: String, answer: String }],
      takenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      takenAt: { type: Date, default: null },
    },
    createdBy: mongoose.Schema.Types.ObjectId,
  }, { timestamps: true });

  const AlertSchema = new mongoose.Schema({
    type: String, title: String, message: String,
    module: String, isRead: { type: Boolean, default: false },
    isResolved: { type: Boolean, default: false }, resolvedAt: Date,
  }, { timestamps: true });

  const ActivityLogSchema = new mongoose.Schema({
    action: String, module: String, details: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    refId: mongoose.Schema.Types.ObjectId, color: String,
  }, { timestamps: true });

  const LabRequestSchema = new mongoose.Schema({
    requestId: { type: String, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tests: [{ name: String, category: String }],
    status: String,
    results: [{ testName: String, value: String, unit: String, referenceRange: String, flag: String }],
    validatedBy: mongoose.Schema.Types.ObjectId, validatedAt: Date, notes: String,
  }, { timestamps: true });

  const InvoiceSchema = new mongoose.Schema({
    invoiceId: { type: String, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    items: [{ description: String, category: String, amount: Number }],
    totalAmount: Number, paidAmount: Number, status: String,
    payments: [{ amount: Number, method: String, paidAt: Date, notes: String }],
    notes: String, createdBy: mongoose.Schema.Types.ObjectId,
  }, { timestamps: true });

  const MedicalRecordSchema = new mongoose.Schema({
    recordId: { type: String, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: String,
    content: { chiefComplaint: String, examination: String, diagnosis: String, treatmentPlan: String, notes: String },
  }, { timestamps: true });

  const ImagingStudySchema = new mongoose.Schema({
    studyId: { type: String, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: String, bodyPart: String, status: String, report: String, notes: String,
  }, { timestamps: true });

  const PharmacyItemSchema = new mongoose.Schema({
    name: String, category: String, quantity: Number, unit: String,
    minThreshold: Number, supplier: String, expiryDate: Date, unitPrice: Number, status: String,
  }, { timestamps: true });

  // Create models
  const Patient = mongoose.model('Patient', PatientSchema);
  const Appointment = mongoose.model('Appointment', AppointmentSchema);
  const Alert = mongoose.model('Alert', AlertSchema);
  const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
  const LabRequest = mongoose.model('LabRequest', LabRequestSchema);
  const Invoice = mongoose.model('Invoice', InvoiceSchema);
  const MedicalRecord = mongoose.model('MedicalRecord', MedicalRecordSchema);
  const ImagingStudy = mongoose.model('ImagingStudy', ImagingStudySchema);
  const PharmacyItem = mongoose.model('PharmacyItem', PharmacyItemSchema);
  const User = mongoose.model('User');

  // Get user IDs
  const admin = await User.findOne({ email: 'admin@medicore.com' });
  const doctor = await User.findOne({ email: 'doctor@medicore.com' });
  const doctor2 = await User.findOne({ email: 'doctor2@medicore.com' });

  if (!admin || !doctor) {
    console.error('❌ Users not found. Run seed users first!');
    process.exit(1);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create patients
  const patients = await Patient.insertMany([
    { patientId: 'P-2026-0001', firstName: 'John', lastName: 'Doe', dateOfBirth: new Date('1978-05-15'), gender: 'male', phone: '+1-555-0101', email: 'john.doe@email.com', category: 'outpatient', createdBy: admin._id },
    { patientId: 'P-2026-0002', firstName: 'Jane', lastName: 'Smith', dateOfBirth: new Date('1992-08-22'), gender: 'female', phone: '+1-555-0102', email: 'jane.smith@email.com', category: 'emergency', createdBy: admin._id },
    { patientId: 'P-2026-0003', firstName: 'Robert', lastName: 'Brown', dateOfBirth: new Date('2016-03-10'), gender: 'male', phone: '+1-555-0103', category: 'outpatient', createdBy: admin._id },
    { patientId: 'P-2026-0004', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: new Date('1959-11-30'), gender: 'female', phone: '+1-555-0104', category: 'hospitalized', createdBy: admin._id },
    { patientId: 'P-2026-0005', firstName: 'James', lastName: 'Wilson', dateOfBirth: new Date('1985-07-18'), gender: 'male', phone: '+1-555-0105', category: 'outpatient', createdBy: admin._id },
    { patientId: 'P-2026-0006', firstName: 'Patricia', lastName: 'Martinez', dateOfBirth: new Date('1970-02-25'), gender: 'female', phone: '+1-555-0106', category: 'external', createdBy: admin._id },
    { patientId: 'P-2026-0007', firstName: 'Michael', lastName: 'Anderson', dateOfBirth: new Date('1995-12-05'), gender: 'male', phone: '+1-555-0107', category: 'outpatient', createdBy: admin._id },
    { patientId: 'P-2026-0008', firstName: 'Linda', lastName: 'Taylor', dateOfBirth: new Date('1988-09-14'), gender: 'female', phone: '+1-555-0108', category: 'hospitalized', createdBy: admin._id },
  ]);
  console.log(`  ✓ Created ${patients.length} patients`);

  // Create appointments
  const appts = await Appointment.insertMany([
    { patient: patients[0]._id, doctor: doctor._id, department: 'Cardiology', dateTime: new Date(today.getTime() + 9 * 3600000), duration: 30, reason: 'Follow-up consultation', status: 'in-progress', createdBy: admin._id },
    { patient: patients[1]._id, doctor: doctor._id, department: 'Emergency', dateTime: new Date(today.getTime() + 9 * 3600000 + 30 * 60000), duration: 45, reason: 'Acute chest pain', status: 'in-progress', createdBy: admin._id },
    { patient: patients[2]._id, doctor: doctor2?._id || doctor._id, department: 'Pediatrics', dateTime: new Date(today.getTime() + 10 * 3600000), duration: 20, reason: 'Vaccination', status: 'confirmed', createdBy: admin._id },
    { patient: patients[3]._id, doctor: doctor._id, department: 'Neurology', dateTime: new Date(today.getTime() + 10 * 3600000 + 30 * 60000), duration: 30, reason: 'Chronic headache', status: 'confirmed', createdBy: admin._id },
    { patient: patients[4]._id, doctor: doctor._id, department: 'General Medicine', dateTime: new Date(today.getTime() + 11 * 3600000), duration: 30, reason: 'Annual check-up', status: 'completed', createdBy: admin._id },
    { patient: patients[5]._id, doctor: doctor._id, department: 'Ophthalmology', dateTime: new Date(today.getTime() + 14 * 3600000), duration: 30, reason: 'Vision test', status: 'scheduled', createdBy: admin._id },
    { patient: patients[6]._id, doctor: doctor._id, department: 'Dermatology', dateTime: new Date(today.getTime() + 15 * 3600000), duration: 30, reason: 'Skin examination', status: 'confirmed', createdBy: admin._id },
    { patient: patients[7]._id, doctor: doctor._id, department: 'Surgery', dateTime: new Date(today.getTime() + 16 * 3600000), duration: 60, reason: 'Pre-operative assessment', status: 'in-preparation', createdBy: admin._id },
  ]);
  console.log(`  ✓ Created ${appts.length} appointments`);

  // Create alerts
  await Alert.insertMany([
    { type: 'error', title: 'Critical Stock Alert', message: 'Amoxicillin 500mg stock critically low (14 units remaining)', module: 'pharmacy' },
    { type: 'warning', title: 'Pending Lab Results', message: '3 lab results pending validation for over 2 hours', module: 'lab' },
    { type: 'info', title: 'System Update Available', message: 'Version 3.2.1 is ready for installation', module: 'system' },
  ]);
  console.log('  ✓ Created 3 system alerts');

  // Create activity logs
  await ActivityLog.insertMany([
    { action: 'Blood test analysis', module: 'lab', details: 'validated', user: doctor._id, color: 'var(--green)', createdAt: new Date(Date.now() - 5 * 60000) },
    { action: 'Medical record #2847', module: 'record', details: 'updated', user: doctor._id, color: 'var(--accent)', createdAt: new Date(Date.now() - 10 * 60000) },
    { action: 'Pharmacy stock alert', module: 'pharmacy', details: 'Paracetamol below threshold', user: admin._id, color: 'var(--amber)', createdAt: new Date(Date.now() - 15 * 60000) },
    { action: 'Cardiac echo imaging', module: 'imaging', details: 'archived', user: doctor._id, color: 'var(--purple)', createdAt: new Date(Date.now() - 20 * 60000) },
    { action: 'Emergency admission', module: 'patient', details: 'Jane Smith registered', user: admin._id, color: 'var(--red)', createdAt: new Date(Date.now() - 25 * 60000) },
    { action: 'Invoice #F-2026-0412', module: 'billing', details: 'paid - $850', user: admin._id, color: 'var(--green)', createdAt: new Date(Date.now() - 30 * 60000) },
    { action: 'New patient registered', module: 'patient', details: 'Robert Brown admitted', user: admin._id, color: 'var(--accent)', createdAt: new Date(Date.now() - 40 * 60000) },
    { action: 'System backup', module: 'system', details: 'completed successfully', user: admin._id, color: 'var(--muted)', createdAt: new Date(Date.now() - 50 * 60000) },
  ]);
  console.log('  ✓ Created 8 activity logs');

  // Create lab requests
  await LabRequest.insertMany([
    { requestId: 'L-2026-0001', patient: patients[0]._id, doctor: doctor._id, tests: [{ name: 'Complete Blood Count', category: 'Hematology' }], status: 'validated', results: [{ testName: 'WBC', value: '7.2', unit: '10^9/L', referenceRange: '4.5-11', flag: 'normal' }] },
    { requestId: 'L-2026-0002', patient: patients[1]._id, doctor: doctor._id, tests: [{ name: 'Cardiac Enzymes', category: 'Cardiology' }], status: 'in-progress' },
    { requestId: 'L-2026-0003', patient: patients[4]._id, doctor: doctor._id, tests: [{ name: 'Lipid Panel', category: 'Biochemistry' }], status: 'completed' },
    ...Array.from({ length: 20 }, (_, i) => ({
      requestId: `L-2026-${String(i + 4).padStart(4, '0')}`,
      patient: patients[i % patients.length]._id,
      doctor: doctor._id,
      tests: [{ name: ['CBC', 'Urinalysis', 'Glucose', 'HbA1c', 'Thyroid Panel'][i % 5], category: 'General' }],
      status: 'completed',
    })),
  ]);
  console.log('  ✓ Created 23 lab requests');

  // Create invoices
  await Invoice.insertMany([
    { invoiceId: 'F-2026-0001', patient: patients[0]._id, items: [{ description: 'Cardiology Consultation', category: 'consultation', amount: 150 }], totalAmount: 150, paidAmount: 150, status: 'paid', payments: [{ amount: 150, method: 'card', paidAt: new Date() }], createdBy: admin._id },
    { invoiceId: 'F-2026-0002', patient: patients[1]._id, items: [{ description: 'Emergency Care', category: 'emergency', amount: 500 }], totalAmount: 500, paidAmount: 250, status: 'partially-paid', payments: [{ amount: 250, method: 'cash', paidAt: new Date() }], createdBy: admin._id },
    ...Array.from({ length: 15 }, (_, i) => ({
      invoiceId: `F-2026-${String(i + 3).padStart(4, '0')}`,
      patient: patients[i % patients.length]._id,
      items: [{ description: 'Medical Consultation', category: 'consultation', amount: 100 + (i * 25) }],
      totalAmount: 100 + (i * 25),
      paidAmount: i % 3 === 0 ? 100 + (i * 25) : i % 3 === 1 ? 50 : 0,
      status: i % 3 === 0 ? 'paid' : i % 3 === 1 ? 'partially-paid' : 'unpaid',
      payments: i % 3 !== 2 ? [{ amount: i % 3 === 0 ? 100 + (i * 25) : 50, method: 'cash', paidAt: new Date() }] : [],
      createdBy: admin._id,
    })),
  ]);
  console.log('  ✓ Created 17 invoices');

  // Create medical records
  await MedicalRecord.insertMany(
    patients.slice(0, 5).map((p, i) => ({
      recordId: `R-2026-${String(i + 1).padStart(4, '0')}`,
      patient: p._id,
      doctor: doctor._id,
      type: 'consultation',
      content: {
        chiefComplaint: 'Routine examination',
        examination: 'Physical examination completed',
        diagnosis: 'Patient in good health',
        treatmentPlan: 'Continue regular check-ups',
        notes: 'No immediate concerns',
      },
    }))
  );
  console.log('  ✓ Created 5 medical records');

  // Create imaging studies
  await ImagingStudy.insertMany([
    { studyId: 'IMG-2026-0001', patient: patients[0]._id, doctor: doctor._id, type: 'echocardiography', bodyPart: 'Heart', status: 'completed', report: 'Normal cardiac function' },
    { studyId: 'IMG-2026-0002', patient: patients[3]._id, doctor: doctor._id, type: 'mri', bodyPart: 'Brain', status: 'completed', report: 'No abnormalities detected' },
    { studyId: 'IMG-2026-0003', patient: patients[7]._id, doctor: doctor._id, type: 'xray', bodyPart: 'Chest', status: 'requested' },
  ]);
  console.log('  ✓ Created 3 imaging studies');

  // Create pharmacy items
  await PharmacyItem.insertMany([
    { name: 'Amoxicillin 500mg', category: 'Antibiotics', quantity: 14, unit: 'tablets', minThreshold: 50, supplier: 'PharmaCorp', expiryDate: new Date('2027-06-01'), unitPrice: 12, status: 'low-stock' },
    { name: 'Paracetamol 500mg', category: 'Analgesics', quantity: 8, unit: 'tablets', minThreshold: 30, supplier: 'MedSupply Inc', expiryDate: new Date('2027-03-15'), unitPrice: 5, status: 'low-stock' },
    { name: 'Omeprazole 20mg', category: 'Gastroenterology', quantity: 200, unit: 'capsules', minThreshold: 20, supplier: 'PharmaCorp', expiryDate: new Date('2027-12-01'), unitPrice: 15, status: 'in-stock' },
    { name: 'Metformin 850mg', category: 'Diabetes', quantity: 150, unit: 'tablets', minThreshold: 30, supplier: 'DiabetesCare', expiryDate: new Date('2027-09-01'), unitPrice: 8, status: 'in-stock' },
    { name: 'Atorvastatin 10mg', category: 'Cardiology', quantity: 100, unit: 'tablets', minThreshold: 20, supplier: 'CardioMed', expiryDate: new Date('2028-01-01'), unitPrice: 18, status: 'in-stock' },
    { name: 'Ibuprofen 400mg', category: 'Analgesics', quantity: 0, unit: 'tablets', minThreshold: 40, supplier: 'MedSupply Inc', expiryDate: new Date('2027-05-01'), unitPrice: 6, status: 'out-of-stock' },
    { name: 'Lisinopril 10mg', category: 'Cardiology', quantity: 120, unit: 'tablets', minThreshold: 25, supplier: 'CardioMed', expiryDate: new Date('2027-08-15'), unitPrice: 10, status: 'in-stock' },
  ]);
  console.log('  ✓ Created 7 pharmacy items');

  await mongoose.disconnect();
}

// ============================================
// MAIN EXECUTION
// ============================================
async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   MediCore Database Reset & Seed Script   ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    await dropDatabase();
    await seedUsers();
    await seedDashboard();

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║          ✅ ALL DONE! SUCCESS!            ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('\n🚀 Your database is now clean and seeded with professional data.');
    console.log('🔐 You can now login with any of the credentials above.');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
