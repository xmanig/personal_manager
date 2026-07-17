const API_BASE = 'http://localhost:3001';

export interface AuthStatus {
  connected: boolean;
  email?: string;
}

export interface GoogleAccount {
  id: string;
  email: string;
  label: string | null;
  isDefault: boolean;
  createdAt: string;
}

export async function getAuthStatus(): Promise<AuthStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/status`);
    if (!res.ok) return { connected: false };
    return res.json();
  } catch {
    return { connected: false };
  }
}

export function startGoogleAuth(label?: string) {
  const params = label ? `?state=${encodeURIComponent(label)}` : '';
  window.location.href = `${API_BASE}/api/auth/google${params}`;
}

export async function disconnectGoogle(): Promise<void> {
  await fetch(`${API_BASE}/api/auth/disconnect`, { method: 'POST' });
}

export async function listAccounts(): Promise<GoogleAccount[]> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/accounts`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.accounts || [];
  } catch {
    return [];
  }
}

export async function deleteAccount(id: string): Promise<void> {
  await fetch(`${API_BASE}/api/auth/accounts/${id}`, { method: 'DELETE' });
}

export async function setDefaultAccount(id: string): Promise<void> {
  await fetch(`${API_BASE}/api/auth/accounts/${id}/default`, { method: 'PUT' });
}

export async function updateAccountLabel(id: string, label: string): Promise<void> {
  await fetch(`${API_BASE}/api/auth/accounts/${id}/label`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label }),
  });
}
