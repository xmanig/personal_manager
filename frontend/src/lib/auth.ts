const API_BASE = 'http://localhost:3001';

export interface AuthStatus {
  connected: boolean;
  email?: string;
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

export function startGoogleAuth() {
  window.location.href = `${API_BASE}/api/auth/google`;
}

export async function disconnectGoogle(): Promise<void> {
  await fetch(`${API_BASE}/api/auth/disconnect`, { method: 'POST' });
}
