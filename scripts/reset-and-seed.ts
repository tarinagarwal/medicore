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
      firstName: 'Rachid',
      lastName: 'Amrani',
      email: 'admin@medicore.com',
      password: await hash('admin123', 12),
      role: 'admin',
      department: 'Administration',
    },
    {
      firstName: 'Fatima',
      lastName: 'Benkirane',
      email: 'doctor@medicore.com',
      password: await hash('doctor123', 12),
      role: 'doctor',
      department: 'Cardiology',
    },
    {
      firstName: 'Karim',
      lastName: 'Tazi',
      email: 'nurse@medicore.com',
      password: await hash('nurse123', 12),
      role: 'nurse',
      department: 'General',
    },
    {
      firstName: 'Nadia',
      lastName: 'Alaoui',
      email: 'lab@medicore.com',
      password: await hash('lab123', 12),
      role: 'lab-tech',
      department: 'Laboratory',
    },
    {
      firstName: 'Omar',
      lastName: 'Sebti',
      email: 'pharmacist@medicore.com',
      password: await hash('pharma123', 12),
      role: 'pharmacist',
      department: 'Pharmacy',
    },
    {
      firstName: 'Laila',
      lastName: 'Chraibi',
      email: 'receptionist@medicore.com',
      password: await hash('reception123', 12),
      role: 'receptionist',
      department: 'Reception',
    },
    {
      firstName: 'Youssef',
      lastName: 'Moussaoui',
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
  const HospitalSchema = new mongoose.Schema({
    name: String,
    address: String,
    phone: String,
    email: String,
    isActive: { type: Boolean, default: true },
  }, { timestamps: true });

  const PatientSchema = new mongoose.Schema({
    patientId: { type: String, unique: true },
    firstName: String, lastName: String,
    dateOfBirth: Date, gender: String,
    phone: String, email: String,
    address: { street: String, city: String, region: String, postalCode: String },
    insuranceInfo: { provider: String, policyNumber: String },
    emergencyContact: { name: String, phone: String, relationship: String },
    category: String, status: { type: String, default: 'active' },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
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
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
  }, { timestamps: true });

  const InvoiceSchema = new mongoose.Schema({
    invoiceId: { type: String, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    items: [{ description: String, category: String, amount: Number }],
    totalAmount: Number, paidAmount: Number, status: String,
    payments: [{ amount: Number, method: String, paidAt: Date, notes: String }],
    notes: String,
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
    createdBy: mongoose.Schema.Types.ObjectId,
  }, { timestamps: true });

  const MedicalRecordSchema = new mongoose.Schema({
    recordId: { type: String, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: String,
    content: { chiefComplaint: String, examination: String, diagnosis: String, treatmentPlan: String, notes: String },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
  }, { timestamps: true });

  const ImagingStudySchema = new mongoose.Schema({
    studyId: { type: String, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: String, bodyPart: String, status: String, report: String, notes: String,
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
  }, { timestamps: true });

  const PharmacyItemSchema = new mongoose.Schema({
    name: String, category: String, quantity: Number, unit: String,
    minThreshold: Number, supplier: String, expiryDate: Date, unitPrice: Number, status: String,
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
  }, { timestamps: true });

  // Create models
  const Hospital = mongoose.model('Hospital', HospitalSchema);
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
  const receptionist = await User.findOne({ email: 'receptionist@medicore.com' });

  if (!admin || !doctor || !receptionist) {
    console.error('❌ Users not found. Run seed users first!');
    process.exit(1);
  }

  // Create hospitals
  const hospitals = await Hospital.insertMany([
    { name: 'Centre Hospitalier Universitaire', address: 'Casablanca', phone: '+212522000001', email: 'contact@chu.ma', isActive: true },
    { name: 'Clinique Al Madina', address: 'Rabat', phone: '+212537000002', email: 'info@almadina.ma', isActive: true },
    { name: 'Hôpital Ibn Sina', address: 'Marrakech', phone: '+212524000003', email: 'contact@ibnsina.ma', isActive: true },
  ]);
  console.log(`  ✓ Created ${hospitals.length} hospitals`);

  // Assign hospitals to some users
  await User.findByIdAndUpdate(doctor._id, { hospital: hospitals[0]._id });
  await User.findByIdAndUpdate(receptionist._id, { hospital: hospitals[0]._id });
  console.log('  ✓ Assigned hospitals to users');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create patients (mix of hospital-assigned and centralized)
  const patients = await Patient.insertMany([
    { patientId: 'P-2026-0001', firstName: 'Fatima', lastName: 'Alaoui', dateOfBirth: new Date('1981-03-15'), gender: 'female', phone: '+212600000001', category: 'outpatient', hospital: hospitals[0]._id, createdBy: admin._id },
    { patientId: 'P-2026-0002', firstName: 'Youssef', lastName: 'Benali', dateOfBirth: new Date('1994-07-22'), gender: 'male', phone: '+212600000002', category: 'emergency', hospital: hospitals[0]._id, createdBy: admin._id },
    { patientId: 'P-2026-0003', firstName: 'Nadia', lastName: 'Moussaoui', dateOfBirth: new Date('1998-11-05'), gender: 'female', phone: '+212600000003', category: 'outpatient', hospital: hospitals[1]._id, createdBy: admin._id },
    { patientId: 'P-2026-0004', firstName: 'Hamid', lastName: 'Tazi', dateOfBirth: new Date('1959-01-10'), gender: 'male', phone: '+212600000004', category: 'hospitalized', hospital: hospitals[1]._id, createdBy: admin._id },
    { patientId: 'P-2026-0005', firstName: 'Sara', lastName: 'Kadiri', dateOfBirth: new Date('2007-06-28'), gender: 'female', phone: '+212600000005', category: 'outpatient', hospital: hospitals[2]._id, createdBy: admin._id },
    { patientId: 'P-2026-0006', firstName: 'Omar', lastName: 'Chraibi', dateOfBirth: new Date('1975-09-03'), gender: 'male', phone: '+212600000006', category: 'external', hospital: null, createdBy: admin._id },
    { patientId: 'P-2026-0007', firstName: 'Laila', lastName: 'Sebti', dateOfBirth: new Date('1988-12-17'), gender: 'female', phone: '+212600000007', category: 'outpatient', hospital: null, createdBy: admin._id },
    { patientId: 'P-2026-0008', firstName: 'Karim', lastName: 'Berrada', dateOfBirth: new Date('1990-04-20'), gender: 'male', phone: '+212600000008', category: 'hospitalized', hospital: null, createdBy: admin._id },
  ]);
  console.log(`  ✓ Created ${patients.length} patients`);

  // Create appointments (mix of hospital-assigned and centralized)
  const appts = await Appointment.insertMany([
    { patient: patients[0]._id, doctor: doctor._id, department: 'Cardiology', dateTime: new Date(today.getTime() + 9 * 3600000 + 15 * 60000), duration: 30, reason: 'Follow-up', status: 'in-progress', createdBy: admin._id, hospital: hospitals[0]._id },
    { patient: patients[1]._id, doctor: doctor._id, department: 'Emergency', dateTime: new Date(today.getTime() + 9 * 3600000 + 40 * 60000), duration: 45, reason: 'Acute pain', status: 'in-progress', createdBy: admin._id, hospital: hospitals[0]._id },
    { patient: patients[2]._id, doctor: doctor._id, department: 'Gynecology', dateTime: new Date(today.getTime() + 10 * 3600000), duration: 30, reason: 'Check-up', status: 'confirmed', createdBy: admin._id, hospital: hospitals[1]._id },
    { patient: patients[3]._id, doctor: doctor._id, department: 'Neurology', dateTime: new Date(today.getTime() + 10 * 3600000 + 30 * 60000), duration: 30, reason: 'Headache', status: 'confirmed', createdBy: admin._id, hospital: hospitals[1]._id },
    { patient: patients[4]._id, doctor: doctor._id, department: 'Pediatrics', dateTime: new Date(today.getTime() + 11 * 3600000), duration: 20, reason: 'Vaccination', status: 'completed', createdBy: admin._id, hospital: hospitals[2]._id },
    { patient: patients[5]._id, doctor: doctor._id, department: 'Ophthalmology', dateTime: new Date(today.getTime() + 11 * 3600000 + 30 * 60000), duration: 30, reason: 'Eye exam', status: 'scheduled', createdBy: admin._id, hospital: null },
    { patient: patients[6]._id, doctor: doctor._id, department: 'Dermatology', dateTime: new Date(today.getTime() + 14 * 3600000), duration: 30, reason: 'Skin rash', status: 'confirmed', createdBy: admin._id, hospital: null },
    { patient: patients[7]._id, doctor: doctor._id, department: 'Surgery', dateTime: new Date(today.getTime() + 15 * 3600000 + 30 * 60000), duration: 60, reason: 'Pre-op', status: 'in-preparation', createdBy: admin._id, hospital: null },
  ]);
  console.log(`  ✓ Created ${appts.length} appointments`);

  // Create alerts
  await Alert.insertMany([
    { type: 'error', title: 'Critical stock — Amoxicillin 500mg', message: 'Remaining quantity: 14 units. Resupply required.', module: 'pharmacy' },
    { type: 'warning', title: '3 LIS results not transmitted', message: 'Analyses pending for > 2h. Check the laboratory module.', module: 'lab' },
    { type: 'info', title: 'System update available', message: 'Version 3.2.1 ready. Automatic sync enabled.', module: 'system' },
  ]);
  console.log('  ✓ Created 3 system alerts');

  // Create activity logs
  await ActivityLog.insertMany([
    { action: 'NFS analysis', module: 'lab', details: 'validated', user: doctor._id, color: 'var(--green)', createdAt: new Date(Date.now() - 3 * 60000) },
    { action: 'Record #2847', module: 'record', details: 'updated', user: doctor._id, color: 'var(--accent)', createdAt: new Date(Date.now() - 8 * 60000) },
    { action: 'Paracetamol 1g stock', module: 'pharmacy', details: 'below threshold', user: admin._id, color: 'var(--amber)', createdAt: new Date(Date.now() - 12 * 60000) },
    { action: 'Cardiac echo PACS', module: 'imaging', details: 'archived', user: doctor._id, color: 'var(--purple)', createdAt: new Date(Date.now() - 15 * 60000) },
    { action: 'Emergency admission — Youssef Benali', module: 'patient', details: 'registered', user: admin._id, color: 'var(--red)', createdAt: new Date(Date.now() - 20 * 60000) },
    { action: 'Invoice #F-2026-0412', module: 'billing', details: 'paid — 850 MAD', user: admin._id, color: 'var(--green)', createdAt: new Date(Date.now() - 25 * 60000) },
    { action: 'New patient', module: 'patient', details: 'admitted — Nadia Moussaoui', user: admin._id, color: 'var(--accent)', createdAt: new Date(Date.now() - 38 * 60000) },
    { action: 'Cloud backup AWS', module: 'patient', details: 'complete — 100% success', user: admin._id, color: 'var(--muted)', createdAt: new Date(Date.now() - 45 * 60000) },
    { action: 'Lab request #L-2026-0034', module: 'lab', details: 'created', user: doctor._id, color: 'var(--accent2)', createdAt: new Date(Date.now() - 52 * 60000) },
  ]);
  console.log('  ✓ Created 8 activity logs');

  // Create lab requests (mix of hospital-assigned and centralized)
  await LabRequest.insertMany([
    { requestId: 'L-2026-0001', patient: patients[0]._id, doctor: doctor._id, tests: [{ name: 'NFS', category: 'Hematology' }], status: 'validated', results: [{ testName: 'NFS', value: '5.2', unit: '10^9/L', referenceRange: '4.5-11', flag: 'normal' }], hospital: hospitals[0]._id },
    { requestId: 'L-2026-0002', patient: patients[1]._id, doctor: doctor._id, tests: [{ name: 'CRP', category: 'Biochemistry' }], status: 'in-progress', hospital: hospitals[0]._id },
    { requestId: 'L-2026-0003', patient: patients[2]._id, doctor: doctor._id, tests: [{ name: 'TSH', category: 'Endocrinology' }], status: 'requested', hospital: hospitals[1]._id },
    ...Array.from({ length: 31 }, (_, i) => ({
      requestId: `L-2026-${String(i + 4).padStart(4, '0')}`,
      patient: patients[i % patients.length]._id, doctor: doctor._id,
      tests: [{ name: ['NFS', 'CRP', 'TSH', 'HbA1c', 'Lipid Panel'][i % 5], category: 'General' }],
      status: 'completed',
      hospital: i % 3 === 0 ? hospitals[i % hospitals.length]._id : null,
    })),
  ]);
  console.log('  ✓ Created 34 lab requests');

  // Create invoices (mix of hospital-assigned and centralized)
  await Invoice.insertMany([
    { invoiceId: 'F-2026-0001', patient: patients[0]._id, items: [{ description: 'Consultation', category: 'consultation', amount: 300 }], totalAmount: 300, paidAmount: 300, status: 'paid', payments: [{ amount: 300, method: 'cash', paidAt: new Date() }], hospital: hospitals[0]._id, createdBy: admin._id },
    ...Array.from({ length: 17 }, (_, i) => ({
      invoiceId: `F-2026-${String(i + 2).padStart(4, '0')}`,
      patient: patients[i % patients.length]._id,
      items: [{ description: 'Consultation', category: 'consultation', amount: 200 + (i * 50) }],
      totalAmount: 200 + (i * 50), paidAmount: i % 3 === 0 ? 200 + (i * 50) : i % 3 === 1 ? 100 : 0,
      status: i % 3 === 0 ? 'paid' : i % 3 === 1 ? 'partially-paid' : 'unpaid',
      payments: i % 3 !== 2 ? [{ amount: i % 3 === 0 ? 200 + (i * 50) : 100, method: 'cash', paidAt: new Date() }] : [],
      hospital: i % 2 === 0 ? hospitals[i % hospitals.length]._id : null,
      createdBy: admin._id,
    })),
  ]);
  console.log('  ✓ Created 18 invoices');

  // Create medical records (mix of hospital-assigned and centralized)
  await MedicalRecord.insertMany(
    patients.slice(0, 5).map((p, i) => ({
      recordId: `R-2026-${String(i + 1).padStart(4, '0')}`,
      patient: p._id,
      doctor: doctor._id,
      type: 'consultation',
      content: { chiefComplaint: 'Routine check', diagnosis: 'Normal', notes: 'No issues' },
      hospital: i < 3 ? hospitals[i % hospitals.length]._id : null,
    }))
  );
  console.log('  ✓ Created 5 medical records');

  // Create imaging studies (mix of hospital-assigned and centralized)
  await ImagingStudy.insertMany([
    { studyId: 'IMG-2026-0001', patient: patients[0]._id, doctor: doctor._id, type: 'echocardiography', bodyPart: 'Heart', status: 'archived', hospital: hospitals[0]._id },
    { studyId: 'IMG-2026-0002', patient: patients[3]._id, doctor: doctor._id, type: 'mri', bodyPart: 'Brain', status: 'completed', hospital: hospitals[1]._id },
    { studyId: 'IMG-2026-0003', patient: patients[7]._id, doctor: doctor._id, type: 'xray', bodyPart: 'Chest', status: 'requested', hospital: null },
  ]);
  console.log('  ✓ Created 3 imaging studies');

  // Create pharmacy items (mix of hospital-assigned and centralized)
  await PharmacyItem.insertMany([
    { name: 'Amoxicillin 500mg', category: 'Antibiotics', quantity: 14, unit: 'tablets', minThreshold: 50, supplier: 'PharmaCo', expiryDate: new Date('2027-06-01'), unitPrice: 5, status: 'low-stock', hospital: hospitals[0]._id },
    { name: 'Paracetamol 1g', category: 'Analgesics', quantity: 8, unit: 'tablets', minThreshold: 30, supplier: 'MedSupply', expiryDate: new Date('2027-03-15'), unitPrice: 3, status: 'low-stock', hospital: hospitals[0]._id },
    { name: 'Omeprazole 20mg', category: 'Gastroenterology', quantity: 200, unit: 'capsules', minThreshold: 20, supplier: 'PharmaCo', expiryDate: new Date('2027-12-01'), unitPrice: 8, status: 'in-stock', hospital: hospitals[1]._id },
    { name: 'Metformin 850mg', category: 'Diabetes', quantity: 150, unit: 'tablets', minThreshold: 30, supplier: 'DiabCare', expiryDate: new Date('2027-09-01'), unitPrice: 4, status: 'in-stock', hospital: hospitals[1]._id },
    { name: 'Atorvastatin 10mg', category: 'Cardiology', quantity: 100, unit: 'tablets', minThreshold: 20, supplier: 'CardioMed', expiryDate: new Date('2028-01-01'), unitPrice: 10, status: 'in-stock', hospital: hospitals[2]._id },
    { name: 'Ibuprofen 400mg', category: 'Analgesics', quantity: 0, unit: 'tablets', minThreshold: 40, supplier: 'MedSupply', expiryDate: new Date('2027-05-01'), unitPrice: 4, status: 'out-of-stock', hospital: null },
  ]);
  console.log('  ✓ Created 6 pharmacy items');

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
