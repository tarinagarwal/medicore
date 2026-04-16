# MediCore Login Credentials

## 🔐 Test Accounts

After running `npm run reset`, use these credentials to log in:

### Admin Account
- **Email:** admin@medicore.com
- **Password:** admin123
- **Role:** Administrator
- **Access:** Full system access - all modules, settings, user management

### Doctor Account
- **Email:** doctor@medicore.com
- **Password:** doctor123
- **Role:** Doctor (Cardiology)
- **Access:** Dashboard, Patients, Records, Lab, Imaging, Reports

### Receptionist Account
- **Email:** receptionist@medicore.com
- **Password:** reception123
- **Role:** Receptionist
- **Access:** Dashboard, Appointments, Patients, Billing (limited)

### Nurse Account
- **Email:** nurse@medicore.com
- **Password:** nurse123
- **Role:** Nurse
- **Access:** Patient care functions

### Lab Technician Account
- **Email:** lab@medicore.com
- **Password:** lab123
- **Role:** Lab Technician
- **Access:** Laboratory module

### Pharmacist Account
- **Email:** pharmacist@medicore.com
- **Password:** pharma123
- **Role:** Pharmacist
- **Access:** Pharmacy module

### Billing Staff Account
- **Email:** billing@medicore.com
- **Password:** billing123
- **Role:** Billing Staff
- **Access:** Billing and Reports

---

## 🚀 Quick Login Links

### For Video Demo:
1. **Reception Panel:** http://localhost:3000/login?role=reception
   - Email: receptionist@medicore.com
   - Password: reception123

2. **Doctor Panel:** http://localhost:3000/login?role=doctor
   - Email: doctor@medicore.com
   - Password: doctor123

3. **Admin Panel:** http://localhost:3000/login?role=admin
   - Email: admin@medicore.com
   - Password: admin123

---

## 📝 Notes

- All passwords are the same format: `{role}123`
- Signup functionality has been disabled - all users must be created by admin
- Users can only be created through Settings → Users (admin only)
- Each user can be assigned to a specific hospital
- Hospital field is now available in:
  - Patients
  - Appointments
  - Medical Records
  - Lab Requests
  - Imaging Studies
  - Pharmacy Items
  - Invoices

---

## 🔄 Reset Database

To reset the database with clean seed data:

```bash
npm run reset
```

This will:
1. Clear all existing data
2. Create 7 user accounts (listed above)
3. Seed sample data (patients, appointments, lab requests, etc.)
4. All with Moroccan names and professional data
