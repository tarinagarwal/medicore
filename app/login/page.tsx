'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, Stethoscope, Shield } from 'lucide-react';
import s from '@/styles/login.module.css';

type RoleType = 'reception' | 'doctor' | 'admin';

const roleConfig: Record<RoleType, {
  label: string;
  desc: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  indicatorBg: string;
  indicatorColor: string;
  placeholder: string;
  btnBg: string;
  btnHover: string;
}> = {
  reception: {
    label: 'Reception',
    desc: 'Booking & Intake',
    icon: <Clock size={22} />,
    iconBg: 'rgba(6,182,212,0.12)',
    iconColor: 'var(--accent2)',
    borderColor: 'var(--accent2)',
    indicatorBg: 'rgba(6,182,212,0.08)',
    indicatorColor: 'var(--accent2)',
    placeholder: 'reception@medicore.com',
    btnBg: 'var(--accent2)',
    btnHover: '#0891B2',
  },
  doctor: {
    label: 'Doctor',
    desc: 'Diagnosis & Records',
    icon: <Stethoscope size={22} />,
    iconBg: 'rgba(139,92,246,0.12)',
    iconColor: 'var(--purple)',
    borderColor: 'var(--purple)',
    indicatorBg: 'rgba(139,92,246,0.08)',
    indicatorColor: 'var(--purple)',
    placeholder: 'doctor@medicore.com',
    btnBg: 'var(--purple)',
    btnHover: '#7C3AED',
  },
  admin: {
    label: 'Administrator',
    desc: 'Full Access',
    icon: <Shield size={22} />,
    iconBg: 'rgba(59,130,246,0.12)',
    iconColor: 'var(--accent)',
    borderColor: 'var(--accent)',
    indicatorBg: 'rgba(59,130,246,0.08)',
    indicatorColor: 'var(--accent)',
    placeholder: 'admin@medicore.com',
    btnBg: 'var(--accent)',
    btnHover: '#2563EB',
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={s.page}><div className={s.container}><div className={s.card}><div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading...</div></div></div></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const roleParam = searchParams.get('role') as RoleType | null;
  const validRoles: RoleType[] = ['reception', 'doctor', 'admin'];
  const initialRole = roleParam && validRoles.includes(roleParam) ? roleParam : null;
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const config = selectedRole ? roleConfig[selectedRole] : null;

  return (
    <div className={s.page}>
      <div className={s.container}>
        {/* Logo */}
        <div className={s.logoWrap}>
          <div className={s.logoIcon}>
            <svg viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className={s.logoName}>MediCore</div>
        </div>

        {/* Role Selector */}
        {!selectedRole && (
          <>
            <div className={s.title}>Choose your access</div>
            <div className={s.subtitle}>Select your role to sign in to the appropriate dashboard</div>

            <div className={s.roleSelector}>
              {(Object.entries(roleConfig) as [RoleType, typeof roleConfig['reception']][]).map(([key, cfg]) => (
                <div
                  key={key}
                  className={`${s.roleCard}`}
                  onClick={() => { setSelectedRole(key); setEmail(''); setPassword(''); setError(''); }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={s.roleIconWrap} style={{ background: cfg.iconBg, color: cfg.iconColor }}>
                    {cfg.icon}
                  </div>
                  <div className={s.roleCardLabel}>{cfg.label}</div>
                  <div className={s.roleCardDesc}>{cfg.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Login Form (shown after role selection) */}
        {selectedRole && config && (
          <div className={s.card} style={{ borderColor: config.borderColor }}>
            {/* Role Indicator */}
            <div className={s.roleIndicator} style={{ background: config.indicatorBg, color: config.indicatorColor }}>
              {config.icon}
              <span>Signing in as {config.label}</span>
            </div>

            <div className={s.title}>Welcome back</div>
            <div className={s.subtitle}>Enter your credentials to access the {config.label.toLowerCase()} dashboard</div>

            {registered && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--green)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', marginBottom: '16px', textAlign: 'center' }}>
                Account created successfully! Please sign in.
              </div>
            )}

            {error && <div className={s.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className={s.formGroup}>
                <label className={s.label} htmlFor="email">Email</label>
                <input
                  id="email"
                  className={s.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={config.placeholder}
                  required
                  autoFocus
                />
              </div>

              <div className={s.formGroup}>
                <label className={s.label} htmlFor="password">Password</label>
                <input
                  id="password"
                  className={s.input}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                className={s.btn}
                type="submit"
                disabled={loading}
                style={{ background: config.btnBg }}
                onMouseEnter={(e) => (e.currentTarget.style.background = config.btnHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = config.btnBg)}
              >
                {loading ? 'Signing in...' : `Sign In as ${config.label}`}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', fontSize: '13px' }}>
              <button
                onClick={() => { setSelectedRole(null); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font)' }}
              >
                ← Choose different role
              </button>
              <Link href="/contact" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '13px' }}>
                Need Help?
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
