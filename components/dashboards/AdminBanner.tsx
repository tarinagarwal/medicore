'use client';

import { Shield } from 'lucide-react';
import s from '@/styles/role-dashboards.module.css';

export default function AdminBanner({ userName }: { userName: string }) {
  return (
    <div className={`${s.roleBanner} ${s.roleBannerAdmin}`}>
      <div className={s.roleIcon} style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent)' }}>
        <Shield size={16} />
      </div>
      <div className={s.roleLabel}>Administrator Mode — Full Access</div>
      <div className={s.roleUser}>{userName}</div>
    </div>
  );
}
