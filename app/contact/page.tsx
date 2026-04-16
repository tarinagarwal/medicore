'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import styles from '@/styles/ui.module.css';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setSuccess(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={32} />
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 400, marginBottom: '12px' }}>Request Submitted</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' }}>
            Thank you for contacting us. Our team will review your request and get back to you as soon as possible.
          </p>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '13px', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--muted)', fontSize: '13px', textDecoration: 'none', marginBottom: '24px' }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '32px' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 400, marginBottom: '8px' }}>Need Help?</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '24px' }}>
            Fill out the form below and our support team will get back to you shortly.
          </p>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Name *</label>
              <input
                className={styles.formInput}
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Your full name"
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email *</label>
                <input
                  className={styles.formInput}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone</label>
                <input
                  className={styles.formInput}
                  value={form.phone}
                  onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Subject *</label>
              <input
                className={styles.formInput}
                value={form.subject}
                onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))}
                placeholder="Brief description of your issue"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Message *</label>
              <textarea
                className={styles.formInput}
                value={form.message}
                onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                placeholder="Describe your issue or question in detail..."
                rows={6}
                required
                style={{ resize: 'vertical', fontFamily: 'var(--font)' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Submitting...' : (
                <>
                  <Send size={16} />
                  Submit Request
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
