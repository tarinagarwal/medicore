# MediCore - Hospital Management System

A comprehensive hospital management system built with Next.js, TypeScript, and MongoDB. Manage patients, appointments, medical records, laboratory tests, imaging studies, pharmacy inventory, and billing all in one place.

## 🚀 Features

- **Patient Management** - Register and manage patient records with complete medical history
- **Appointments** - Schedule and track appointments across multiple departments
- **Medical Records (DME/DSE)** - Digital medical records with consultation notes, diagnoses, and treatment plans
- **Laboratory (LIS)** - Lab test requests, results tracking, and validation
- **Imaging (PACS)** - Imaging study requests and reports (X-Ray, CT, MRI, Ultrasound, Echo)
- **Pharmacy** - Inventory management with stock alerts and expiry tracking
- **Billing & Cash** - Invoice generation, payment tracking, and financial reports
- **Multi-Hospital Support** - Manage multiple hospital locations with centralized or distributed data
- **Role-Based Access Control** - Admin, Doctor, Nurse, Lab Tech, Pharmacist, Receptionist, Billing roles
- **Real-time Alerts** - System notifications for critical stock levels, pending tests, etc.
- **Activity Logging** - Complete audit trail of all system activities

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, React, TypeScript
- **Backend:** Next.js API Routes
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** NextAuth.js with bcrypt
- **Styling:** CSS Modules
- **Icons:** Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 6+
- npm or pnpm

## 🔧 Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd medicore
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/medicore
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

4. Seed the database with sample data:
```bash
npm run reset
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔐 Default Login Credentials

After running `npm run reset`, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@medicore.com | admin123 |
| Doctor | doctor@medicore.com | doctor123 |
| Receptionist | receptionist@medicore.com | reception123 |
| Nurse | nurse@medicore.com | nurse123 |
| Lab Tech | lab@medicore.com | lab123 |
| Pharmacist | pharmacist@medicore.com | pharma123 |
| Billing | billing@medicore.com | billing123 |

See [LOGIN-CREDENTIALS.md](./LOGIN-CREDENTIALS.md) for more details.

## 📁 Project Structure

```
medicore/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── appointments/      # Appointments pages
│   ├── patients/          # Patients pages
│   ├── records/           # Medical records pages
│   ├── lab/               # Laboratory pages
│   ├── imaging/           # Imaging pages
│   ├── pharmacy/          # Pharmacy pages
│   ├── billing/           # Billing pages
│   └── settings/          # Settings pages
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── ui/               # Reusable UI components
│   └── [module]/         # Module-specific components
├── lib/                   # Utility functions
├── models/                # MongoDB models
├── scripts/               # Database scripts
├── styles/                # CSS modules
└── types/                 # TypeScript types

```

## 🎯 Key Features Explained

### Multi-Hospital Support
- Assign users to specific hospitals
- Filter data by hospital
- Support for centralized records (no hospital assigned)
- Hospital dropdown in all modules

### Role-Based Access Control
- **Admin:** Full system access, user management, settings
- **Doctor:** Patient records, appointments, lab/imaging requests
- **Receptionist:** Patient registration, appointments, billing
- **Nurse:** Patient care functions
- **Lab Tech:** Laboratory module access
- **Pharmacist:** Pharmacy inventory management
- **Billing:** Invoice and payment management

### Smart ID Generation
- Auto-generated IDs for all records (P-2026-0001, L-2026-0001, etc.)
- Year-based sequencing
- Prevents duplicate key errors

## 🔄 Database Management

### Reset Database
```bash
npm run reset
```
This will:
- Clear all existing data
- Create 7 user accounts
- Seed sample data (patients, appointments, lab requests, etc.)
- Create 3 test hospitals

### Backup Database
```bash
mongodump --uri="mongodb://localhost:27017/medicore" --out=./backup
```

### Restore Database
```bash
mongorestore --uri="mongodb://localhost:27017/medicore" ./backup/medicore
```

## 🚢 Deployment

### Environment Variables
Make sure to set these in production:
```env
MONGODB_URI=your-production-mongodb-uri
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-domain.com
```

### Build for Production
```bash
npm run build
npm start
```

## 📝 License

This project is private and proprietary.

## 👥 Contributors

- Development Team

## 🐛 Known Issues

- None currently

## 📞 Support

For support, contact your system administrator.
