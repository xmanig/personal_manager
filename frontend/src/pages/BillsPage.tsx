import { useState, useEffect } from 'react';
import { Bill, BILL_CATEGORIES, BILL_STATUSES } from '../types/bills';
import { fetchBills, updateBill, deleteBill, fetchBillsFromGmail } from '../lib/bills-api';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

const API_BASE = 'http://localhost:3001';

export function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState<{ category?: string; status?: string }>({});
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  useEffect(() => { loadBills(); }, []);

  const loadBills = async () => {
    try {
      const data = await fetchBills();
      setBills(data);
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchFromGmail = async () => {
    setFetching(true);
    try {
      await fetchBillsFromGmail({ hasAttachment: true });
      await loadBills();
    } catch (err) {
      console.error('Failed to fetch from Gmail:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleMarkPaid = async (bill: Bill) => {
    await updateBill(bill.id, { status: 'paid', paidDate: new Date().toISOString() });
    await loadBills();
  };

  const handleRevokePaid = async (bill: Bill) => {
    await updateBill(bill.id, { status: 'pending', paidDate: null });
    await loadBills();
  };

  const handleMarkAllPaid = async (bills: Bill[]) => {
    const pending = bills.filter((b) => b.status === 'pending');
    for (const bill of pending) {
      await updateBill(bill.id, { status: 'paid', paidDate: new Date().toISOString() });
    }
    await loadBills();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bill?')) return;
    await deleteBill(id);
    await loadBills();
  };

  const filteredBills = bills.filter((bill) => {
    if (filter.category && bill.category !== filter.category) return false;
    if (filter.status && bill.status !== filter.status) return false;
    return true;
  });

  const totalPending = filteredBills.filter((b) => b.status === 'pending').reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = filteredBills.filter((b) => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0);

  const statusBadge = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'default'> = { paid: 'success', pending: 'warning', overdue: 'danger', cancelled: 'default' };
    return map[status] || 'default';
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 dark:border-primary-900 dark:border-t-primary-400" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-800">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bills</h1>
        <Button size="sm" onClick={handleFetchFromGmail} loading={fetching}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {fetching ? 'Fetching...' : 'Fetch from Gmail'}
        </Button>
      </div>

      <div className="flex gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <div className="flex-1 rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
          <div className="text-xs font-medium text-amber-700 dark:text-amber-400">Pending</div>
          <div className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-200">${totalPending.toFixed(2)}</div>
        </div>
        <div className="flex-1 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
          <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Paid</div>
          <div className="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-200">${totalPaid.toFixed(2)}</div>
        </div>
        <div className="flex-1 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-400">Total</div>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">${(totalPending + totalPaid).toFixed(2)}</div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 px-5 py-3 dark:border-gray-800">
        <select value={filter.category || ''} onChange={(e) => setFilter({ ...filter, category: e.target.value || undefined })}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-primary-500 dark:focus:ring-primary-900/50">
          <option value="">All categories</option>
          {BILL_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
        </select>
        <select value={filter.status || ''} onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-primary-500 dark:focus:ring-primary-900/50">
          <option value="">All statuses</option>
          {BILL_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredBills.length === 0 ? (
          <EmptyState
            icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>}
            title="No bills found" description="Fetch bills from Gmail or add them manually"
            action={<Button size="sm" onClick={handleFetchFromGmail}>Fetch from Gmail</Button>} />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <div className="flex items-center gap-4 bg-gray-50/50 px-5 py-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
              <div className="w-[14%]">Vendor</div>
              <div className="w-[14%]">Invoice #</div>
              <div className="w-[12%] text-right">Amount</div>
              <div className="w-[12%]">Due Date</div>
              <div className="w-[12%]">Received</div>
              <div className="w-[10%]">Category</div>
              <div className="w-[10%]">Status</div>
              <div className="flex-1 text-right">Actions</div>
            </div>
            {(() => {
              const groups: Record<string, Bill[]> = {};
              const sorted = [...filteredBills].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              for (const bill of sorted) {
                const d = new Date(bill.createdAt);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(bill);
              }
              return Object.entries(groups).map(([month, bills]) => (
                <div key={month}>
                  <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-5 py-2 dark:bg-gray-950">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {new Date(month + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    {bills.some((b) => b.status === 'pending') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAllPaid(bills)}
                      >
                        <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Mark All Paid
                      </Button>
                    )}
                  </div>
                  {bills.map((bill) => (
                    <BillRow
                      key={bill.id}
                      bill={bill}
                      onMarkPaid={handleMarkPaid}
                      onRevokePaid={handleRevokePaid}
                      onEdit={setEditingBill}
                      onDelete={handleDelete}
                      statusBadge={statusBadge}
                      API_BASE={API_BASE}
                    />
                  ))}
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      <Modal isOpen={!!editingBill} onClose={() => setEditingBill(null)} title="Edit Bill">
        {editingBill && (
          <BillEditForm bill={editingBill}
            onSave={async (data) => { await updateBill(editingBill.id, data); setEditingBill(null); await loadBills(); }}
            onCancel={() => setEditingBill(null)} />
        )}
      </Modal>
    </div>
  );
}

function BillRow({
  bill, onMarkPaid, onRevokePaid, onEdit, onDelete, statusBadge, API_BASE
}: {
  bill: Bill;
  onMarkPaid: (bill: Bill) => void;
  onRevokePaid: (bill: Bill) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (id: string) => void;
  statusBadge: (s: string) => 'success' | 'warning' | 'danger' | 'default';
  API_BASE: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
      <div className="w-[14%] truncate text-sm font-medium text-gray-900 dark:text-gray-100">{bill.vendor}</div>
      <div className="w-[14%] truncate text-sm text-gray-500 dark:text-gray-400">
        {bill.invoiceNumber || '-'}
      </div>
      <div className="w-[12%] text-right text-sm tabular-nums text-gray-900 dark:text-gray-100">
        <div>{bill.amount.toFixed(2)} {bill.currency}</div>
        {bill.localAmount != null && bill.localCurrency && (
          <div className="text-[10px] text-gray-400 dark:text-gray-500">
            ≈ {bill.localAmount.toFixed(2)} {bill.localCurrency}
          </div>
        )}
      </div>
      <div className="w-[12%] text-sm text-gray-500 dark:text-gray-400">
        {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}
      </div>
      <div className="w-[12%] text-sm text-gray-500 dark:text-gray-400">
        {new Date(bill.createdAt).toLocaleDateString()}
      </div>
      <div className="w-[10%]"><Badge>{bill.category}</Badge></div>
      <div className="w-[10%]"><Badge variant={statusBadge(bill.status)}>{bill.status}</Badge></div>
      <div className="flex flex-1 justify-end gap-1">
        {bill.pdfUrl && (
          <a href={`${API_BASE}/api/bills/${bill.id}/pdf`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
            <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            PDF
          </a>
        )}
        {bill.status === 'paid' ? (
          <Button variant="ghost" size="sm" onClick={() => onRevokePaid(bill)} className="text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20">
            <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Revoke
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => onMarkPaid(bill)}>
            <svg className="mr-1 h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Mark Paid
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onEdit(bill)}>Edit</Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(bill.id)}>
          <svg className="h-4 w-4 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </Button>
      </div>
    </div>
  );
}

function BillEditForm({ bill, onSave, onCancel }: { bill: Bill; onSave: (data: Partial<Bill>) => void; onCancel: () => void }) {
  const [vendor, setVendor] = useState(bill.vendor);
  const [amount, setAmount] = useState(bill.amount.toString());
  const [category, setCategory] = useState(bill.category);
  const [status, setStatus] = useState(bill.status);
  const [notes, setNotes] = useState(bill.notes || '');

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Vendor</label>
        <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-900/50" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.01"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-900/50" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-900/50">
            {BILL_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-900/50">
            {BILL_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-900/50" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ vendor, amount: parseFloat(amount), category, status, notes: notes || null })}>Save</Button>
      </div>
    </div>
  );
}
