import { Bill, BillExtraction } from '../types/bills';

const API_BASE = '/api/bills';

export async function fetchBills(): Promise<Bill[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Failed to fetch bills');
  return res.json();
}

export async function fetchBill(id: string): Promise<Bill> {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch bill');
  return res.json();
}

export async function updateBill(
  id: string,
  data: Partial<Pick<Bill, 'vendor' | 'amount' | 'currency' | 'dueDate' | 'paidDate' | 'category' | 'status' | 'notes' | 'lineItems'>>
): Promise<Bill> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update bill');
  return res.json();
}

export async function deleteBill(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete bill');
}

export async function fetchBillsFromGmail(
  rules: {
    senderContains?: string;
    subjectContains?: string;
    hasAttachment?: boolean;
    dateRange?: { from?: string; to?: string };
  },
  googleAccountId?: string
): Promise<{ fetched: number; bills: Bill[] }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (googleAccountId) {
    headers['X-Google-Account-Id'] = googleAccountId;
  }
  const res = await fetch(`${API_BASE}/fetch-gmail`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ rules, googleAccountId }),
  });
  if (!res.ok) throw new Error('Failed to fetch bills from Gmail');
  return res.json();
}

export async function fetchBillsFromAllAccounts(
  rules: {
    senderContains?: string;
    subjectContains?: string;
    hasAttachment?: boolean;
    dateRange?: { from?: string; to?: string };
  }
): Promise<{ fetched: number; bills: Bill[]; errors?: { email: string; error: string }[] }> {
  const res = await fetch(`${API_BASE}/fetch-gmail-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rules }),
  });
  if (!res.ok) throw new Error('Failed to fetch bills from all accounts');
  return res.json();
}

export async function parseBill(rawText: string): Promise<BillExtraction> {
  const res = await fetch(`${API_BASE}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText }),
  });
  if (!res.ok) throw new Error('Failed to parse bill');
  return res.json();
}
