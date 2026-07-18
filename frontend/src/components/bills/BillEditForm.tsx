import { useState } from 'react';
import { Bill, BILL_CATEGORIES, BILL_STATUSES } from '../../types/bills';
import { Button } from '../ui/Button';

interface BillEditFormProps {
  bill: Bill;
  onSave: (data: Partial<Bill>) => void;
  onCancel: () => void;
}

export function BillEditForm({ bill, onSave, onCancel }: BillEditFormProps) {
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
