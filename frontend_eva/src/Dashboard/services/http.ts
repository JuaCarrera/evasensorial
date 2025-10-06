// src/services/http.ts
export const API_URL = import.meta.env.VITE_API_URL ?? 'https://evasensorial-backend.onrender.com/api';

export function getToken() {
  return localStorage.getItem('token') ?? '';
}

export async function http<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${getToken()}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  let payload: any = null;
  try { payload = await res.json(); } catch { /* puede ser vacío */ }

  if (!res.ok) {
    const message = payload?.message || payload?.error || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return payload as T;
}
