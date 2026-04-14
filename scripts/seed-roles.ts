import mongoose from 'mongoose';
import { hash } from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

const UserSchema = new mongoose.Schema({
  firstName: String, lastName: String,
  email: { type: String, unique: true, lowercase: true },
  password: { type: String, select: false },
  role: String, department: String,
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const HospitalSchema = new mongoose.Schema({
  name: String, address: String, phone: String, email: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const PatientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true }, firstName: String, lastName: String,
  dateOfBirth: Date, gender: String, phone: String, email: String,
  address: { street: String, city: String, region: String, postalCode: String },
  insuranceInfo: { provider: String, policyNumber: String },
  emergencyContact: { name: String, phone: String, relationship: String },
  category: String, status: { type: String, default: 'active' },
  hospital: mongoose.Schema.Types.ObjectId,
  createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

const AppointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department: String, dateTime: Date, duration: Number,
  reason: String, status: String, notes: String,
  hospital: mongoose.Schema.Types.ObjectId,
  intake: {
    vitals: { weight: String, bloodPressure: String },
    questions: [{ question: String, answer: String }],
    takenBy: mongoose.Schema.Types.ObjectId,
    takenAt: Date,
  },
  createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

async function seed() {
  console.log('Connecting...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Clearing existing data...');

  await mongoose.connection.db!.dropDatabase();
  console.log('Database cleared.\n');

  const Hospital = mongoose.model('Hospital', HospitalSchema);
  const User = mongoose.model('User', UserSchema);
  const Patient = mongoose.model('Patient', PatientSchema);
  const Appointment = mongoose.model('Appointment', AppointmentSchema);

  // ── Hospitals ──
  const [hospital1, hospital2] = await Hospital.insertMany([
    { name: 'MediCore Central Hospital', address: '123 Boulevard Mohammed V, Casablanca', phone: '+212 522 000 001', email: 'central@medicore.com' },
    { name: 'MediCore North Clinic', address: '45 Avenue Hassan II, Rabat', phone: '+212 537 000 002', email: 'north@medicore.com' },
  ]);
  console.log('  Created 2 hospitals');

  // ── Users (3 roles) ──
  const adminPw = await hash('admin123', 12);
  const doctorPw = await hash('doctor123', 12);
  const receptionPw = await hash('reception123', 12);

  const admin = await User.create({
    firstName: 'Admin', lastName: 'Amrani', email: 'admin@medicore.com',
    password: adminPw, role: 'admin', department: 'Administration', hospital: null,
  });

  const doctor = await User.create({
    firstName: 'Fatima', lastName: 'Benkirane', email: 'doctor@medicore.com',
    password: doctorPw, role: 'doctor', department: 'Cardiology', hospital: hospital1._id,
  });

  const doctor2 = await User.create({
    firstName: 'Karim', lastName: 'Tazi', email: 'doctor2@medicore.com',
    password: doctorPw, role: 'doctor', department: 'Neurology', hospital: hospital2._id,
  });

  const receptionist = await User.create({
    firstName: 'Nadia', lastName: 'Alaoui', email: 'reception@medicore.com',
    password: receptionPw, role: 'receptionist', department: 'Reception', hospital: hospital1._id,
  });

  console.log('  Created 4 users');

  // ── Patients ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const patients = await Patient.insertMany([
    { patientId: 'P-2026-0001', firstName: 'Youssef', lastName: 'Benali', dateOfBirth: new Date('1994-07-22'), gender: 'male', phone: '+212600000001', category: 'outpatient', hospital: hospital1._id, createdBy: receptionist._id },
    { patientId: 'P-2026-0002', firstName: 'Sara', lastName: 'Kadiri', dateOfBirth: new Date('2007-06-28'), gender: 'female', phone: '+212600000002', category: 'outpatient', hospital: hospital1._id, createdBy: receptionist._id },
    { patientId: 'P-2026-0003', firstName: 'Omar', lastName: 'Chraibi', dateOfBirth: new Date('1975-09-03'), gender: 'male', phone: '+212600000003', category: 'emergency', hospital: hospital1._id, createdBy: receptionist._id },
    { patientId: 'P-2026-0004', firstName: 'Laila', lastName: 'Sebti', dateOfBirth: new Date('1988-12-17'), gender: 'female', phone: '+212600000004', category: 'outpatient', hospital: hospital1._id, createdBy: receptionist._id },
    { patientId: 'P-2026-0005', firstName: 'Hamid', lastName: 'Moussaoui', dateOfBirth: new Date('1959-01-10'), gender: 'male', phone: '+212600000005', category: 'hospitalized', hospital: hospital2._id, createdBy: admin._id },
    { patientId: 'P-2026-0006', firstName: 'Amina', lastName: 'Berrada', dateOfBirth: new Date('1990-04-20'), gender: 'female', phone: '+212600000006', category: 'outpatient', hospital: hospital2._id, createdBy: admin._id },
  ]);
  console.log(`  Created ${patients.length} patients`);

  // ── Appointments with intake data ──
  const appointments = await Appointment.insertMany([
    // Hospital 1: Patients with intake (reception completed)
    {
      patient: patients[0]._id, doctor: doctor._id, department: 'Cardiology',
      dateTime: new Date(today.getTime() + 9 * 3600000 + 15 * 60000), duration: 30,
      reason: 'Chest pain follow-up', status: 'confirmed',
      hospital: hospital1._id, createdBy: receptionist._id,
      intake: {
        vitals: { weight: '78', bloodPressure: '140/90' },
        questions: [
          { question: 'Do you have any allergies?', answer: 'Penicillin' },
          { question: 'Are you currently on any medication?', answer: 'Aspirin 100mg daily' },
          { question: 'Have you had any recent surgeries?', answer: 'No' },
        ],
        takenBy: receptionist._id, takenAt: new Date(Date.now() - 30 * 60000),
      },
    },
    {
      patient: patients[1]._id, doctor: doctor._id, department: 'Cardiology',
      dateTime: new Date(today.getTime() + 10 * 3600000), duration: 30,
      reason: 'Annual check-up', status: 'confirmed',
      hospital: hospital1._id, createdBy: receptionist._id,
      intake: {
        vitals: { weight: '52', bloodPressure: '110/70' },
        questions: [
          { question: 'Do you have any allergies?', answer: 'None' },
          { question: 'Are you currently on any medication?', answer: 'No' },
          { question: 'Have you had any recent surgeries?', answer: 'No' },
        ],
        takenBy: receptionist._id, takenAt: new Date(Date.now() - 20 * 60000),
      },
    },
    {
      patient: patients[2]._id, doctor: doctor._id, department: 'Emergency',
      dateTime: new Date(today.getTime() + 10 * 3600000 + 30 * 60000), duration: 45,
      reason: 'Acute chest pain', status: 'in-progress',
      hospital: hospital1._id, createdBy: receptionist._id,
      intake: {
        vitals: { weight: '85', bloodPressure: '160/95' },
        questions: [
          { question: 'Do you have any allergies?', answer: 'None known' },
          { question: 'Are you currently on any medication?', answer: 'Metformin 500mg, Atorvastatin 20mg' },
          { question: 'Have you had any recent surgeries?', answer: 'Appendectomy in 2019' },
        ],
        takenBy: receptionist._id, takenAt: new Date(Date.now() - 15 * 60000),
      },
    },
    // No intake yet (waiting for reception)
    {
      patient: patients[3]._id, doctor: doctor._id, department: 'Cardiology',
      dateTime: new Date(today.getTime() + 11 * 3600000), duration: 30,
      reason: 'Palpitations', status: 'scheduled',
      hospital: hospital1._id, createdBy: receptionist._id,
    },
    // Hospital 2
    {
      patient: patients[4]._id, doctor: doctor2._id, department: 'Neurology',
      dateTime: new Date(today.getTime() + 9 * 3600000), duration: 30,
      reason: 'Recurring headaches', status: 'confirmed',
      hospital: hospital2._id, createdBy: admin._id,
      intake: {
        vitals: { weight: '72', bloodPressure: '130/85' },
        questions: [
          { question: 'Do you have any allergies?', answer: 'Sulfa drugs' },
          { question: 'Are you currently on any medication?', answer: 'Ibuprofen as needed' },
          { question: 'Have you had any recent surgeries?', answer: 'No' },
        ],
        takenBy: admin._id, takenAt: new Date(Date.now() - 45 * 60000),
      },
    },
    {
      patient: patients[5]._id, doctor: doctor2._id, department: 'Neurology',
      dateTime: new Date(today.getTime() + 14 * 3600000), duration: 30,
      reason: 'Dizziness', status: 'scheduled',
      hospital: hospital2._id, createdBy: admin._id,
    },
  ]);
  console.log(`  Created ${appointments.length} appointments`);

  console.log('\n========================================');
  console.log('  DEMO ACCOUNTS');
  console.log('========================================');
  console.log('');
  console.log('  ADMIN (full access):');
  console.log('    Email: admin@medicore.com');
  console.log('    Password: admin123');
  console.log('');
  console.log('  DOCTOR (patient view + diagnosis):');
  console.log('    Email: doctor@medicore.com');
  console.log('    Password: doctor123');
  console.log('');
  console.log('  RECEPTIONIST (booking + intake):');
  console.log('    Email: reception@medicore.com');
  console.log('    Password: reception123');
  console.log('');
  console.log('  Hospitals: MediCore Central, MediCore North');
  console.log('  Patients: 6 (with intake data on 4 appointments)');
  console.log('========================================');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
