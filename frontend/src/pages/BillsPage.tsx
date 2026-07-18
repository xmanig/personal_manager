import { useState, useEffect } from 'react';
import { Bill, BILL_CATEGORIES, BILL_STATUSES, BILL_DIRECTIONS } from '../types/bills';
import { fetchBills, updateBill, deleteBill, fetchBillsFromGmail, fetchBillsFromAllAccounts } from '../lib/bills-api';
import { listAccounts, GoogleAccount } from '../lib/auth';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { BillRow } from '../components/bills/BillRow';
import { BillEditForm } from '../components/bills/BillEditForm';

const API_BASE = 'http://localhost:3001';

export function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState<{ category?: string; status?: string; direction?: string }>({});
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  useEffect(() => {
    loadBills();
    listAccounts().then(setAccounts);
  }, []);

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

  const getAccountEmail = (id: string | null) => {
    if (!id) return '';
    const acc = accounts.find((a) => a.id === id);
    return acc ? (acc.label || acc.email) : '';
  };

  const handleFetchFromGmail = async () => {
    setFetching(true);
    try {
      if (selectedAccountId === '__all__') {
        await fetchBillsFromAllAccounts({ hasAttachment: true });
      } else {
        await fetchBillsFromGmail(
          { hasAttachment: true },
          selectedAccountId || undefined
        );
      }
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
    if (filter.direction && bill.direction !== filter.direction) return false;
    return true;
  });

  const payablePending = filteredBills.filter((b) => b.direction === 'payable' && b.status === 'pending').reduce((sum, b) => sum + b.amount, 0);
  const receivablePending = filteredBills.filter((b) => b.direction === 'receivable' && b.status === 'pending').reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = filteredBills.filter((b) => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0);

  const statusBadge = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'default'> = { paid: 'success', pending: 'warning', overdue: 'danger', cancelled: 'default' };
    return map[status] || 'default';
  };

  const directionBadge = (direction: string): 'success' | 'warning' | 'danger' | 'default' => {
    return direction === 'receivable' ? 'success' : 'danger';
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
        <div className="flex items-center gap-2">
          {accounts.length > 1 && (
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-primary-500 dark:focus:ring-primary-900/50"
            >
              <option value="">Default account</option>
              <option value="__all__">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.label || acc.email}
                </option>
              ))}
            </select>
          )}
          <Button size="sm" onClick={handleFetchFromGmail} loading={fetching}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {fetching ? 'Fetching...' : 'Fetch from Gmail'}
          </Button>
        </div>
      </div>

      <div className="flex gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <div className="flex-1 rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
          <div className="text-xs font-medium text-amber-700 dark:text-amber-400">To Pay</div>
          <div className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-200">${payablePending.toFixed(2)}</div>
        </div>
        <div className="flex-1 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
          <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">To Receive</div>
          <div className="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-200">${receivablePending.toFixed(2)}</div>
        </div>
        <div className="flex-1 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="text-xs font-medium text-blue-700 dark:text-blue-400">Paid</div>
          <div className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-200">${totalPaid.toFixed(2)}</div>
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
        <select value={filter.direction || ''} onChange={(e) => setFilter({ ...filter, direction: e.target.value || undefined })}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-primary-500 dark:focus:ring-primary-900/50">
          <option value="">All directions</option>
          {BILL_DIRECTIONS.map((d) => (<option key={d} value={d}>{d === 'payable' ? 'To Pay' : 'To Receive'}</option>))}
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
              <div className="w-[10%]">Vendor</div>
              <div className="w-[10%]">Invoice #</div>
              <div className="w-[8%] text-right">Amount</div>
              <div className="w-[9%]">Due Date</div>
              <div className="w-[9%]">Received</div>
              <div className="w-[8%]">Category</div>
              <div className="w-[8%]">Direction</div>
              <div className="w-[8%]">Status</div>
              <div className="w-[10%]">Account</div>
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
                      directionBadge={directionBadge}
                      accountLabel={getAccountEmail(bill.googleAccountId)}
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


