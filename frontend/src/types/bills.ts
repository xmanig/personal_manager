export interface Bill {
  id: string;
  vendor: string;
  amount: number;
  currency: string;
  localAmount: number | null;
  localCurrency: string | null;
  dueDate: string | null;
  paidDate: string | null;
  category: string;
  status: string;
  notes: string | null;
  invoiceNumber: string | null;
  rawText: string | null;
  pdfUrl: string | null;
  lineItems: { description: string; amount: number }[];
  gmailMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillExtraction {
  vendor: string;
  amount: number;
  currency: string;
  dueDate: string | null;
  category: string;
  invoiceNumber: string | null;
  lineItems: { description: string; amount: number }[];
  confidence: number;
}

export const BILL_CATEGORIES = [
  'utilities',
  'rent',
  'insurance',
  'subscription',
  'telecom',
  'medical',
  'grocery',
  'other',
] as const;

export const BILL_STATUSES = ['pending', 'paid', 'overdue', 'cancelled'] as const;
