'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import InvoiceFormModal from '@/components/billing/InvoiceFormModal';
import { formatDateShort, formatCurrency } from '@/lib/utils';
import s from '@/styles/billing.module.css';

interface InvoiceRow {
  _id: string; invoiceId: string; totalAmount: number; paidAmount: number; status: string; createdAt: string;
  patient: { firstName: string; lastName: string; patientId: string } | null;
  hospital: { _id: string; name: string } | null;
}

export default function BillingPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [hospitals, setHospitals] = useState<{ _id: string; name: string }[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const limit = 20;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (hospitalFilter) params.set('hospital', hospitalFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    try {
      const res = await fetch(`/api/billing?${params}`);
      const json = await res.json();
      if (json.success) { setInvoices(json.data); setTotal(json.pagination.total); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, hospitalFilter, dateFrom, dateTo]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await fetch('/api/settings/hospitals?status=active');
        const json = await res.json();
        if (json.success) setHospitals(json.data);
      } catch (err) { console.error(err); }
    };
    fetchHospitals();
  }, []);

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => { const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400); return () => clearTimeout(t); }, [searchInput]);

  const columns = [
    { key: 'invoiceId', label: 'Invoice #' },
    { key: 'patient', label: 'Patient', render: (r: Record<string, unknown>) => { const row = r as unknown as InvoiceRow; return row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : '—'; } },
    { key: 'totalAmount', label: 'Total', render: (r: Record<string, unknown>) => `${formatCurrency((r as unknown as InvoiceRow).totalAmount)} MAD` },
    { key: 'paidAmount', label: 'Paid', render: (r: Record<string, unknown>) => { const row = r as unknown as InvoiceRow; return <span style={{ color: row.paidAmount > 0 ? 'var(--green)' : 'var(--muted)' }}>{formatCurrency(row.paidAmount)} MAD</span>; } },
    { key: 'balance', label: 'Balance', render: (r: Record<string, unknown>) => { const row = r as unknown as InvoiceRow; const bal = row.totalAmount - row.paidAmount; return <span style={{ color: bal > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 500 }}>{formatCurrency(bal)} MAD</span>; } },
    {
      key: 'hospital',
      label: 'Hospital',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as InvoiceRow;
        return row.hospital?.name || <span style={{ color: 'var(--muted)' }}>—</span>;
      },
    },
    { key: 'status', label: 'Status', render: (r: Record<string, unknown>) => <StatusBadge status={(r as unknown as InvoiceRow).status} /> },
    { key: 'createdAt', label: 'Date', render: (r: Record<string, unknown>) => formatDateShort(new Date((r as unknown as InvoiceRow).createdAt)) },
  ];

  return (
    <div>
      <div className={s.header}>
        <div className={s.headerLeft}><h1>Billing &amp; Cash</h1><p>{total} invoice{total !== 1 ? 's' : ''}</p></div>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> New Invoice</Button>
      </div>
      <div className={s.controls}>
        <input className={s.searchInput} placeholder="Search invoice #..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <select className={s.filterSelect} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option><option value="unpaid">Unpaid</option><option value="partially-paid">Partially Paid</option><option value="paid">Paid</option>
        </select>
        <select className={s.filterSelect} value={hospitalFilter} onChange={(e) => { setHospitalFilter(e.target.value); setPage(1); }}>
          <option value="">All Hospitals</option>
          {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
        </select>
        <input className={s.dateInput} type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} title="From" />
        <input className={s.dateInput} type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} title="To" />
      </div>
      <Card>
        {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '13px' }}>Loading...</div> : (
          <DataTable columns={columns} data={invoices as unknown as Record<string, unknown>[]} page={page} totalPages={Math.ceil(total / limit)} total={total} onPageChange={setPage}
            onRowClick={(row) => router.push(`/billing/${(row as unknown as InvoiceRow)._id}`)} />
        )}
      </Card>
      <InvoiceFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchInvoices} />
    </div>
  );
}
