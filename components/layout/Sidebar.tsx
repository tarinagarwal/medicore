'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  FlaskConical,
  Search,
  Home,
  DollarSign,
  Activity,
  Settings,
  LogOut,
} from 'lucide-react';
import styles from '@/styles/sidebar.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: 'blue' | 'green' | 'amber';
  roles?: string[]; // if set, only these roles see this item
}

// Role-based visibility for each nav item
function buildNavSections(counts: { patients: number; appointmentsToday: number; labPending: number }): { label: string; items: NavItem[] }[] {
  return [
    {
      label: 'Main',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={16} /> },
        { label: 'Patients', href: '/patients', icon: <Users size={16} />, badge: counts.patients > 0 ? String(counts.patients) : undefined, roles: ['admin', 'doctor', 'receptionist'] },
        { label: 'Appointments', href: '/appointments', icon: <CalendarDays size={16} />, badge: counts.appointmentsToday > 0 ? String(counts.appointmentsToday) : undefined, badgeColor: 'amber' },
        { label: 'DME / DSE', href: '/records', icon: <FileText size={16} />, roles: ['admin', 'doctor'] },
      ],
    },
    {
      label: 'Clinic',
      items: [
        { label: 'Laboratory (LIS)', href: '/lab', icon: <FlaskConical size={16} />, badge: counts.labPending > 0 ? String(counts.labPending) : undefined, badgeColor: 'green', roles: ['admin', 'doctor', 'lab-tech'] },
        { label: 'Imaging (PACS)', href: '/imaging', icon: <Search size={16} />, roles: ['admin', 'doctor'] },
        { label: 'Pharmacy', href: '/pharmacy', icon: <Home size={16} />, roles: ['admin', 'pharmacist'] },
      ],
    },
    {
      label: 'Management',
      items: [
        { label: 'Billing & Cash', href: '/billing', icon: <DollarSign size={16} />, roles: ['admin', 'billing', 'receptionist'] },
        { label: 'Reporting & Stats', href: '/reports', icon: <Activity size={16} />, roles: ['admin', 'billing', 'doctor'] },
        { label: 'Settings', href: '/settings', icon: <Settings size={16} />, roles: ['admin'] },
      ],
    },
  ];
}

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  doctor: 'Doctor',
  nurse: 'Nurse',
  'lab-tech': 'Lab Technician',
  pharmacist: 'Pharmacist',
  receptionist: 'Receptionist',
  billing: 'Billing Staff',
};

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [counts, setCounts] = useState({ patients: 0, appointmentsToday: 0, labPending: 0 });

  useEffect(() => {
    fetch('/api/sidebar')
      .then((r) => r.json())
      .then((j) => { if (j.success) setCounts(j.data); })
      .catch(() => {});
  }, [pathname]); // re-fetch on navigation

  const navSections = buildNavSections(counts);

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoMark}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className={styles.logoName}>MediCore</div>
            <div className={styles.logoSub}>Clinic System</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navSections.map((section) => {
          const userRole = session?.user?.role || '';
          const visibleItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(userRole)
          );
          if (visibleItems.length === 0) return null;

          return (
          <div key={section.label} className={styles.navSection}>
            <div className={styles.navLabel}>{section.label}</div>
            {visibleItems.map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  {item.icon}
                  {item.label}
                  {item.badge && (
                    <span
                      className={`${styles.navBadge} ${
                        item.badgeColor === 'green'
                          ? styles.green
                          : item.badgeColor === 'amber'
                          ? styles.amber
                          : ''
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          );
        })}
      </nav>

      {/* Footer — User Card */}
      <div className={styles.sidebarFooter}>
        <div className={styles.userCard}>
          <div className={styles.avatar}>
            {session?.user
              ? `${session.user.firstName?.charAt(0) || ''}${session.user.lastName?.charAt(0) || ''}`
              : '??'}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>
              {session?.user?.name || 'Loading...'}
            </div>
            <div className={styles.userRole}>
              {session?.user?.role ? roleLabels[session.user.role] || session.user.role : ''}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
