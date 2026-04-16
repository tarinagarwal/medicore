'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import PharmacyFormModal from '@/components/pharmacy/PharmacyFormModal';
import { formatDateShort } from '@/lib/utils';
import s from '@/styles/pharmacy.module.css';

interface PharmacyRow {
  _id: string; name: string; category: string; quantity: number; unit: string;
  minThreshold: number; supplier: string; expiryDate: string; unitPrice: number; status: string;
  hospital: { _id: string; name: string } | null;
}

export default function PharmacyPage() {
  const [items, setItems] = useState<PharmacyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [hospitals, setHospitals] = useState<{ _id: string; name: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PharmacyRow | null>(null);
  const limit = 20;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    if (hospitalFilter) params.set('hospital', hospitalFilter);

    try {
      const res = await fetch(`/api/pharmacy?${params}`);
      const json = await res.json();
      if (json.success) { setItems(json.data); setTotal(json.pagination.total); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, categoryFilter, hospitalFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

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
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const columns = [
    {
      key: 'name', label: 'Product',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as PharmacyRow;
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{row.name}</div>
            {row.category && <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '1px' }}>{row.category}</div>}
          </div>
        );
      },
    },
    {
      key: 'quantity', label: 'Qty',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as PharmacyRow;
        const isLow = row.status === 'low-stock';
        const isOut = row.status === 'out-of-stock';
        return (
          <span className={`${s.qtyCell} ${isLow ? s.qtyLow : ''} ${isOut ? s.qtyOut : ''}`}>
            {row.quantity} {row.unit}
          </span>
        );
      },
    },
    {
      key: 'minThreshold', label: 'Min',
      render: (r: Record<string, unknown>) => `${(r as unknown as PharmacyRow).minThreshold}`,
    },
    {
      key: 'unitPrice', label: 'Price',
      render: (r: Record<string, unknown>) => `${(r as unknown as PharmacyRow).unitPrice} MAD`,
    },
    { key: 'supplier', label: 'Supplier' },
    {
      key: 'hospital',
      label: 'Hospital',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as PharmacyRow;
        return row.hospital?.name || <span style={{ color: 'var(--muted)' }}>—</span>;
      },
    },
    {
      key: 'expiryDate', label: 'Expires',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as PharmacyRow;
        if (!row.expiryDate) return '—';
        const d = new Date(row.expiryDate);
        const isExpired = d < new Date();
        return <span style={isExpired ? { color: 'var(--red)', fontWeight: 500 } : {}}>{formatDateShort(d)}</span>;
      },
    },
    {
      key: 'status', label: 'Status',
      render: (r: Record<string, unknown>) => <StatusBadge status={(r as unknown as PharmacyRow).status} />,
    },
  ];

  return (
    <div>
      <div className={s.header}>
        <div className={s.headerLeft}><h1>Pharmacy</h1><p>{total} product{total !== 1 ? 's' : ''} in inventory</p></div>
        <Button onClick={() => { setEditItem(null); setModalOpen(true); }}><Plus size={16} /> Add Product</Button>
      </div>
      <div className={s.controls}>
        <input className={s.searchInput} placeholder="Search product or supplier..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <select className={s.filterSelect} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
        <select className={s.filterSelect} value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {['Antibiotics', 'Analgesics', 'Gastroenterology', 'Diabetes', 'Cardiology', 'Dermatology', 'Respiratory', 'Vitamins', 'Other'].map(c =>
            <option key={c} value={c}>{c}</option>
          )}
        </select>
        <select className={s.filterSelect} value={hospitalFilter} onChange={(e) => { setHospitalFilter(e.target.value); setPage(1); }}>
          <option value="">All Hospitals</option>
          {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
        </select>
      </div>
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>
        ) : (
          <DataTable columns={columns} data={items as unknown as Record<string, unknown>[]} page={page} totalPages={Math.ceil(total / limit)} total={total} onPageChange={setPage}
            onRowClick={(row) => { setEditItem(row as unknown as PharmacyRow); setModalOpen(true); }} />
        )}
      </Card>
      <PharmacyFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }} onSaved={fetchItems}
        editData={editItem as unknown as Record<string, unknown> | null} />
    </div>
  );
}
