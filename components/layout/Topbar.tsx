'use client';

import styles from '@/styles/topbar.module.css';

interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <span className={styles.topbarTitle}>{title}</span>
    </header>
  );
}
