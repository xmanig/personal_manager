import { useState, useEffect } from 'react';
import { Bill, BILL_CATEGORIES, BILL_STATUSES } from '../types/bills';
import {
  fetchBills,
  updateBill,
  deleteBill,
  fetchBillsFromGmail,
} from '../lib/bills-api';

export function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState<{
    category?: string;
    status?: string;
  }>({});
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  useEffect(() => {
    loadBills();
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await deleteBill(id);
    await loadBills();
  };

  const filteredBills = bills.filter((bill) => {
    if (filter.category && bill.category !== filter.category) return false;
    if (filter.status && bill.status !== filter.status) return false;
    return true;
  });

  const totalPending = filteredBills
    .filter((b) => b.status === 'pending')
    .reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = filteredBills
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  if (loading) {
    return <div className="p-4">Loading bills...</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-semibold">Bills</h1>
        <div className="flex gap-2">
          <button
            onClick={handleFetchFromGmail}
            disabled={fetching}
            className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {fetching ? 'Fetching...' : 'Fetch from Gmail'}
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b p-4 text-sm">
        <div className="rounded bg-yellow-50 p-3">
          <div className="font-medium text-yellow-700">Pending</div>
          <div className="text-xl font-bold">
            ${totalPending.toFixed(2)}
          </div>
        </div>
        <div className="rounded bg-green-50 p-3">
          <div className="font-medium text-green-700">Paid</div>
          <div className="text-xl font-bold">
            ${totalPaid.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b p-4">
        <select
          value={filter.category || ''}
          onChange={(e) => setFilter({ ...filter, category: e.target.value || undefined })}
          className="rounded border px-2 py-1"
        >
          <option value="">All categories</option>
          {BILL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={filter.status || ''}
          onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
          className="rounded border px-2 py-1"
        >
          <option value="">All statuses</option>
          {BILL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredBills.length === 0 ? (
          <div className="p-4 text-gray-500">No bills found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Vendor</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2 text-left">Due Date</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{bill.vendor}</td>
                  <td className="p-2 text-right">
                    {bill.amount.toFixed(2)} {bill.currency}
                  </td>
                  <td className="p-2">
                    {bill.dueDate
                      ? new Date(bill.dueDate).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="p-2">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                      {bill.category}
                    </span>
                  </td>
                  <td className="p-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        bill.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : bill.status === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {bill.status}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    {bill.status !== 'paid' && (
                      <button
                        onClick={() => handleMarkPaid(bill)}
                        className="mr-2 text-sm text-green-600 hover:underline"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => setEditingBill(bill)}
                      className="mr-2 text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(bill.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingBill && (
        <BillEditModal
          bill={editingBill}
          onClose={() => setEditingBill(null)}
          onSave={async (data) => {
            await updateBill(editingBill.id, data);
            setEditingBill(null);
            await loadBills();
          }}
        />
      )}
    </div>
  );
}

function BillEditModal({
  bill,
  onClose,
  onSave,
}: {
  bill: Bill;
  onClose: () => void;
  onSave: (data: Partial<Bill>) => void;
}) {
  const [vendor, setVendor] = useState(bill.vendor);
  const [amount, setAmount] = useState(bill.amount.toString());
  const [category, setCategory] = useState(bill.category);
  const [status, setStatus] = useState(bill.status);
  const [notes, setNotes] = useState(bill.notes || '');

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Bill</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Vendor</label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded border px-3 py-2"
              step="0.01"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded border px-3 py-2"
            >
              {BILL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded border px-3 py-2"
            >
              {BILL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded border px-3 py-2"
              rows={3}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                vendor,
                amount: parseFloat(amount),
                category,
                status,
                notes: notes || null,
              })
            }
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
