import Link from 'next/link';
import {
  Users, CalendarDays, FileText, FlaskConical, Search as SearchIcon,
  Home, DollarSign, Activity, Shield, ArrowRight, Zap, Clock, Stethoscope,
} from 'lucide-react';
import s from '@/styles/landing.module.css';

const features = [
  { icon: <Users size={22} />, bg: 'rgba(59,130,246,0.1)', color: 'var(--accent)', title: 'Patient Management', desc: 'Complete patient registry with demographics, insurance, emergency contacts, and visit history.' },
  { icon: <CalendarDays size={22} />, bg: 'rgba(245,158,11,0.1)', color: 'var(--amber)', title: 'Appointment Scheduling', desc: 'Calendar and list views with status tracking, department filtering, and real-time updates.' },
  { icon: <FileText size={22} />, bg: 'rgba(139,92,246,0.1)', color: 'var(--purple)', title: 'Medical Records (DME)', desc: 'Electronic medical records with consultations, diagnoses, vitals, prescriptions, and treatment plans.' },
  { icon: <FlaskConical size={22} />, bg: 'rgba(16,185,129,0.1)', color: 'var(--green)', title: 'Laboratory (LIS)', desc: 'Lab request management with sample tracking, result entry, validation workflow, and alerts.' },
  { icon: <SearchIcon size={22} />, bg: 'rgba(6,182,212,0.1)', color: 'var(--accent2)', title: 'Imaging (PACS)', desc: 'Imaging study management with request tracking, report storage, and archival system.' },
  { icon: <Home size={22} />, bg: 'rgba(245,158,11,0.1)', color: 'var(--amber)', title: 'Pharmacy Inventory', desc: 'Stock management with low-stock alerts, expiry tracking, and dispensation recording.' },
  { icon: <DollarSign size={22} />, bg: 'rgba(16,185,129,0.1)', color: 'var(--green)', title: 'Billing & Cash', desc: 'Invoice management with offline payment recording, multiple payment methods, and balance tracking.' },
  { icon: <Activity size={22} />, bg: 'rgba(59,130,246,0.1)', color: 'var(--accent)', title: 'Analytics & Reports', desc: 'Department statistics, revenue trends, patient distribution, and appointment analytics.' },
  { icon: <Shield size={22} />, bg: 'rgba(139,92,246,0.1)', color: 'var(--purple)', title: 'Role-Based Access', desc: '7 user roles with granular permissions — admin, doctor, nurse, lab tech, pharmacist, receptionist, billing.' },
];

export default function LandingPage() {
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Navbar ── */}
      <nav className={s.nav}>
        <div className={s.navLogo}>
          <div className={s.navLogoIcon}>
            <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
          <span className={s.navLogoName}>MediCore</span>
        </div>

        <div className={s.navLinks}>
          <a href="#features" className={s.navLink}>Features</a>
          <a href="#stats" className={s.navLink}>Stats</a>
        </div>

        <div className={s.navBtns}>
          <Link href="/contact" className={s.btnOutline} style={{ marginRight: '8px' }}>Need Help?</Link>
          <Link href="/login" className={s.btnOutline}>Log In</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={s.hero}>
        <div className={`${s.heroGlow} ${s.heroGlow1}`} />
        <div className={`${s.heroGlow} ${s.heroGlow2}`} />

        <div className={s.heroContent}>
          <div className={s.heroBadge}>
            <span className={s.heroBadgeDot} />
            Modern Clinic Management Platform
          </div>

          <h1 className={s.heroTitle}>
            Streamline Your<br />
            <span className={s.heroGradient}>Clinic Operations</span>
          </h1>

          <p className={s.heroSubtitle}>
            MediCore is an all-in-one hospital management system that handles patients,
            appointments, medical records, laboratory, pharmacy, billing, and more —
            all from a single beautiful dashboard.
          </p>

          <div className={s.heroBtns}>
            <Link href="/login" className={s.btnHeroPrimary}>
              Log In to Dashboard <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className={s.features}>
        <h2 className={s.featuresTitle}>Everything You Need</h2>
        <p className={s.featuresSubtitle}>
          A complete suite of tools to manage every aspect of your clinic
        </p>

        <div className={s.featuresGrid}>
          {features.map((f) => (
            <div key={f.title} className={s.featureCard}>
              <div className={s.featureIcon} style={{ background: f.bg, color: f.color }}>
                {f.icon}
              </div>
              <div className={s.featureTitle}>{f.title}</div>
              <div className={s.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Role Access Section ── */}
      <section className={s.roleAccess}>
        <h2 className={s.featuresTitle}>Sign In to Your Role</h2>
        <p className={s.featuresSubtitle}>Three dedicated dashboards — each tailored to your responsibilities</p>

        <div className={s.roleCards}>
          <Link href="/login?role=reception" className={s.roleAccessCard} style={{ borderColor: 'rgba(6,182,212,0.2)' }}>
            <div className={s.roleAccessIcon} style={{ background: 'rgba(6,182,212,0.12)', color: 'var(--accent2)' }}>
              <Clock size={26} />
            </div>
            <div className={s.roleAccessLabel}>Reception</div>
            <div className={s.roleAccessDesc}>Book appointments, register patients, take vitals, manage billing</div>
            <div className={s.roleAccessBtn} style={{ color: 'var(--accent2)' }}>Log in as Reception <ArrowRight size={14} /></div>
          </Link>

          <Link href="/login?role=doctor" className={s.roleAccessCard} style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
            <div className={s.roleAccessIcon} style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--purple)' }}>
              <Stethoscope size={26} />
            </div>
            <div className={s.roleAccessLabel}>Doctor</div>
            <div className={s.roleAccessDesc}>Review intake data, diagnose patients, create medical records</div>
            <div className={s.roleAccessBtn} style={{ color: 'var(--purple)' }}>Log in as Doctor <ArrowRight size={14} /></div>
          </Link>

          <Link href="/login?role=admin" className={s.roleAccessCard} style={{ borderColor: 'rgba(59,130,246,0.2)' }}>
            <div className={s.roleAccessIcon} style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}>
              <Shield size={26} />
            </div>
            <div className={s.roleAccessLabel}>Administrator</div>
            <div className={s.roleAccessDesc}>Full control — manage users, doctors, hospitals, and view analytics</div>
            <div className={s.roleAccessBtn} style={{ color: 'var(--accent)' }}>Log in as Admin <ArrowRight size={14} /></div>
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className={s.stats}>
        <div className={s.statsGrid}>
          <div>
            <div className={s.statValue} style={{ color: 'var(--accent)' }}>10+</div>
            <div className={s.statLabel}>Modules</div>
          </div>
          <div>
            <div className={s.statValue} style={{ color: 'var(--green)' }}>7</div>
            <div className={s.statLabel}>User Roles</div>
          </div>
          <div>
            <div className={s.statValue} style={{ color: 'var(--purple)' }}>100%</div>
            <div className={s.statLabel}>Offline Payments</div>
          </div>
          <div>
            <div className={s.statValue} style={{ color: 'var(--amber)' }}>24/7</div>
            <div className={s.statLabel}>Real-time Alerts</div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={s.footer}>
        <p>&copy; {new Date().getFullYear()} MediCore — Clinic Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}
