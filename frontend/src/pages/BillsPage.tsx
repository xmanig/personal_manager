import { useState, useEffect } from 'react';
import { Bill, BILL_CATEGORIES, BILL_STATUSES, BILL_DIRECTIONS } from '../types/bills';
import { fetchBills, updateBill, deleteBill, fetchBillsFromGmail, fetchBillsFromAllAccounts } from '../lib/bills-api';
import { listAccounts, GoogleAccount } from '../lib/auth';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { BillEditForm } from '../components/bills/BillEditForm';

const API_BASE = 'http://localhost:3001';

const statusBadge = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' => {
  const map: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
    paid: 'success', pending: 'warning', overdue: 'danger', cancelled: 'default',
  };
  return map[status] || 'default';
};

const directionBadge = (direction: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' => {
  return direction === 'receivable' ? 'success' : 'danger';
};

export function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState<{ category?: string; status?: string; direction?: string }>({});
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

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

  const handleFetchFromGmail = async () => {
    setFetching(true);
    try {
      if (selectedAccountId === '__all__') {
        await fetchBillsFromAllAccounts({ hasAttachment: true });
      } else {
        await fetchBillsFromGmail({ hasAttachment: true }, selectedAccountId || undefined);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bill?')) return;
    await deleteBill(id);
    await loadBills();
  };

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sortFn = (a: Bill, b: Bill): number => {
    let aVal: any, bVal: any;
    switch (sortKey) {
      case 'vendor': aVal = a.vendor?.toLowerCase(); bVal = b.vendor?.toLowerCase(); break;
      case 'invoiceNumber': aVal = a.invoiceNumber || ''; bVal = b.invoiceNumber || ''; break;
      case 'amount': aVal = a.amount; bVal = b.amount; break;
      case 'dueDate': aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0; bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0; break;
      case 'createdAt': aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); break;
      case 'category': aVal = a.category || ''; bVal = b.category || ''; break;
      case 'direction': aVal = a.direction || ''; bVal = b.direction || ''; break;
      case 'status': aVal = a.status || ''; bVal = b.status || ''; break;
      default: return 0;
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  };

  const filteredBills = bills.filter((bill) => {
    if (filter.category && bill.category !== filter.category) return false;
    if (filter.status && bill.status !== filter.status) return false;
    if (filter.direction && bill.direction !== filter.direction) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!bill.vendor?.toLowerCase().includes(q) && !bill.invoiceNumber?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const payablePending = filteredBills.filter((b) => b.direction === 'payable' && b.status === 'pending').reduce((sum, b) => sum + b.amount, 0);
  const receivablePending = filteredBills.filter((b) => b.direction === 'receivable' && b.status === 'pending').reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = filteredBills.filter((b) => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0);

  const SortHeader = ({ label, sortable }: { label: string; sortable: string }) => (
    <button onClick={() => handleSort(sortable)}
      className={`group flex items-center gap-1 font-semibold uppercase tracking-wider ${sortKey === sortable ? 'text-on-surface' : 'text-outline'}`}>
      {label}
      {sortKey === sortable ? (
        <span className={`material-symbols-outlined text-[16px] transition-transform ${sortDir === 'desc' ? '' : 'rotate-180'}`}>expand_more</span>
      ) : (
        <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-40">unfold_more</span>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Top App Bar */}
      <header className="flex justify-between items-center h-16 px-8 bg-surface border-b border-outline-variant sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Bills</h2>
          <div className="h-6 w-[1px] bg-outline-variant" />
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full text-[12px] font-medium text-on-surface-variant border border-outline-variant/30">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span>Live Sync</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {accounts.length > 1 && (
            <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface-variant focus:border-primary focus:ring-0">
              <option value="">Default account</option>
              <option value="__all__">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.label || acc.email}</option>
              ))}
            </select>
          )}
          <div className="flex items-center bg-surface-container rounded-lg px-3 py-2 border border-outline-variant/50 focus-within:border-primary transition-all">
            <span className="material-symbols-outlined text-outline text-[20px] mr-2">search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm p-0 w-48 text-on-surface placeholder:text-outline-variant" placeholder="Search bills..." type="text" />
          </div>
          <Button size="md" onClick={handleFetchFromGmail} loading={fetching}>
            <span className="material-symbols-outlined text-[18px]">gmail_groups</span>
            {fetching ? 'Fetching...' : 'Fetch from Gmail'}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group"
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            style={{ transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/10 rounded-full blur-3xl group-hover:bg-tertiary/20 transition-all duration-500" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-tertiary-container/20 rounded-xl">
                <span className="material-symbols-outlined text-tertiary text-[28px]">payments</span>
              </div>
              <span className="text-label-md font-label-md text-tertiary uppercase">Pending</span>
            </div>
            <p className="text-on-surface-variant font-medium mb-1">To Pay</p>
            <h3 className="font-headline-lg text-headline-lg font-numeric-data text-tertiary">${payablePending.toFixed(2)}</h3>
          </div>
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group"
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            style={{ transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary-container/20 rounded-xl">
                <span className="material-symbols-outlined text-primary text-[28px]">account_balance</span>
              </div>
              <span className="text-label-md font-label-md text-primary uppercase">Expected</span>
            </div>
            <p className="text-on-surface-variant font-medium mb-1">To Receive</p>
            <h3 className="font-headline-lg text-headline-lg font-numeric-data text-primary">${receivablePending.toFixed(2)}</h3>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-secondary-container/20 relative overflow-hidden group"
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            style={{ transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-all duration-500" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-secondary-container/20 rounded-xl">
                <span className="material-symbols-outlined text-secondary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <span className="text-label-md font-label-md text-secondary uppercase">Settled</span>
            </div>
            <p className="text-on-surface-variant font-medium mb-1">Total Paid</p>
            <h3 className="font-headline-lg text-headline-lg font-numeric-data text-secondary">${totalPaid.toFixed(2)}</h3>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <div className="relative">
              <select value={filter.category || ''} onChange={(e) => setFilter({ ...filter, category: e.target.value || undefined })}
                className="appearance-none bg-surface-container border border-outline-variant rounded-lg pl-4 pr-10 py-2 text-sm text-on-surface-variant focus:border-primary focus:ring-0 cursor-pointer">
                <option value="">All Categories</option>
                {BILL_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">expand_more</span>
            </div>
            <div className="relative">
              <select value={filter.status || ''} onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
                className="appearance-none bg-surface-container border border-outline-variant rounded-lg pl-4 pr-10 py-2 text-sm text-on-surface-variant focus:border-primary focus:ring-0 cursor-pointer">
                <option value="">All Statuses</option>
                {BILL_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">expand_more</span>
            </div>
            <div className="relative">
              <select value={filter.direction || ''} onChange={(e) => setFilter({ ...filter, direction: e.target.value || undefined })}
                className="appearance-none bg-surface-container border border-outline-variant rounded-lg pl-4 pr-10 py-2 text-sm text-on-surface-variant focus:border-primary focus:ring-0 cursor-pointer">
                <option value="">All Directions</option>
                {BILL_DIRECTIONS.map((d) => (<option key={d} value={d}>{d === 'payable' ? 'To Pay' : 'To Receive'}</option>))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="glass-panel rounded-2xl overflow-hidden border-outline-variant/30">
          <div className="bg-surface-container-high/50 px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
            <h4 className="font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">event_note</span>
              Bills
            </h4>
            <span className="text-label-md font-label-md text-outline">{filteredBills.length} TOTAL ENTRIES</span>
          </div>
          <div className="overflow-x-auto data-table-container">
            {filteredBills.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={<span className="material-symbols-outlined text-[48px] text-outline">receipt_long</span>}
                  title="No bills found" description="Fetch bills from Gmail or add them manually"
                  action={<Button size="sm" onClick={handleFetchFromGmail}><span className="material-symbols-outlined text-[18px]">gmail_groups</span>Fetch from Gmail</Button>} />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-[11px] text-outline">
                    <th className="px-6 py-4"><SortHeader label="Vendor" sortable="vendor" /></th>
                    <th className="px-6 py-4"><SortHeader label="Invoice #" sortable="invoiceNumber" /></th>
                    <th className="px-6 py-4 text-right"><SortHeader label="Amount" sortable="amount" /></th>
                    <th className="px-6 py-4"><SortHeader label="Due Date" sortable="dueDate" /></th>
                    <th className="px-6 py-4"><SortHeader label="Category" sortable="category" /></th>
                    <th className="px-6 py-4"><SortHeader label="Direction" sortable="direction" /></th>
                    <th className="px-6 py-4"><SortHeader label="Status" sortable="status" /></th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {[...filteredBills].sort(sortFn).map((bill) => (
                    <tr key={bill.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center font-bold text-primary font-numeric-data">
                            {bill.vendor?.charAt(0) || '?'}
                          </div>
                          <span className="font-medium text-on-surface">{bill.vendor}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-numeric-data text-outline">{bill.invoiceNumber || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-numeric-data text-on-surface font-bold">{bill.amount.toFixed(2)} {bill.currency}</div>
                        {bill.localAmount != null && bill.localCurrency && (
                          <div className="text-[10px] text-outline italic">≈ {bill.localAmount.toFixed(2)} {bill.localCurrency}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-numeric-data text-outline">
                        {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          bill.category === 'utilities' ? 'bg-tertiary-container/10 text-tertiary border-tertiary-container/20' :
                          bill.category === 'telecom' ? 'bg-primary-container/10 text-primary border-primary-container/20' :
                          bill.category === 'subscription' ? 'bg-secondary-container/10 text-secondary border-secondary-container/20' :
                          'bg-surface-container-highest text-on-surface-variant border-outline-variant/30'
                        }`}>{bill.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={directionBadge(bill.direction)}>
                          {bill.direction === 'payable' ? 'To Pay' : 'To Receive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusBadge(bill.status)}>{bill.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          {bill.pdfUrl && (
                            <a href={`${API_BASE}/api/bills/${bill.id}/pdf`} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 hover:bg-surface-variant rounded-md text-outline hover:text-on-surface" title="View PDF">
                              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                            </a>
                          )}
                          {bill.status === 'paid' ? (
                            <button onClick={() => handleRevokePaid(bill)}
                              className="p-1.5 hover:bg-surface-variant rounded-md text-outline hover:text-on-surface" title="Revoke">
                              <span className="material-symbols-outlined text-[20px]">history</span>
                            </button>
                          ) : (
                            <button onClick={() => handleMarkPaid(bill)}
                              className="p-1.5 hover:bg-surface-variant rounded-md text-outline hover:text-on-surface" title="Mark Paid">
                              <span className="material-symbols-outlined text-[20px]">check_circle</span>
                            </button>
                          )}
                          <button onClick={() => setEditingBill(bill)}
                            className="p-1.5 hover:bg-surface-variant rounded-md text-outline hover:text-on-surface" title="Edit">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button onClick={() => handleDelete(bill.id)}
                            className="p-1.5 hover:bg-error-container/20 rounded-md text-outline hover:text-error" title="Delete">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
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
