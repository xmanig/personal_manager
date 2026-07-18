import { Bill } from '../../types/bills';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface BillRowProps {
  bill: Bill;
  onMarkPaid: (bill: Bill) => void;
  onRevokePaid: (bill: Bill) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (id: string) => void;
  statusBadge: (s: string) => 'success' | 'warning' | 'danger' | 'default';
  directionBadge: (s: string) => 'success' | 'warning' | 'danger' | 'default';
  accountLabel: string;
  API_BASE: string;
}

export function BillRow({ bill, onMarkPaid, onRevokePaid, onEdit, onDelete, statusBadge, directionBadge, accountLabel, API_BASE }: BillRowProps) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
      <div className="w-[10%] truncate text-sm font-medium text-gray-900 dark:text-gray-100">{bill.vendor}</div>
      <div className="w-[10%] truncate text-sm text-gray-500 dark:text-gray-400">
        {bill.invoiceNumber || '-'}
      </div>
      <div className="w-[8%] text-right text-sm tabular-nums text-gray-900 dark:text-gray-100">
        <div>{bill.amount.toFixed(2)} {bill.currency}</div>
        {bill.localAmount != null && bill.localCurrency && (
          <div className="text-[10px] text-gray-400 dark:text-gray-500">
            ≈ {bill.localAmount.toFixed(2)} {bill.localCurrency}
          </div>
        )}
      </div>
      <div className="w-[9%] text-sm text-gray-500 dark:text-gray-400">
        {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}
      </div>
      <div className="w-[9%] text-sm text-gray-500 dark:text-gray-400">
        {new Date(bill.createdAt).toLocaleDateString()}
      </div>
      <div className="w-[8%]"><Badge>{bill.category}</Badge></div>
      <div className="w-[8%]"><Badge variant={directionBadge(bill.direction)}>{bill.direction === 'payable' ? 'To Pay' : 'To Receive'}</Badge></div>
      <div className="w-[8%]"><Badge variant={statusBadge(bill.status)}>{bill.status}</Badge></div>
      <div className="w-[10%] truncate text-xs text-gray-400 dark:text-gray-500">{accountLabel}</div>
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
