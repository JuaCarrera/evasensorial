// src/hooks/useLogin.ts
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user?: {
    terapeuta_id: number;
    nombre: string;
    email: string;
    es_superadmin: boolean;
    Cargo?: string;
    identificacion?: string;
    especialidad?: string;
    telefono?: string;
    ubicacion?: string;
    estado?: string;
  };
  message?: string;
}

export function useLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string>('');

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);
    setServerError('');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || 'Error al iniciar sesión');
      }

      const data: LoginResult = await res.json();
      if (!data?.token) throw new Error('Respuesta inválida del servidor');

      // ✅ Guardar token y usuario
      localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));

        // ✅ Redirección según rol
        if (data.user.es_superadmin) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/lite-dashboard', { replace: true });
        }
      } else {
        // fallback por si no viene user
        navigate('/dashboard', { replace: true });
      }

      return data;
    } catch (e: any) {
      const msg = e?.message?.includes('Unauthorized')
        ? 'Credenciales inválidas'
        : e?.message || 'No fue posible iniciar sesión';
      setServerError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  return { login, loading, serverError, setServerError };
}
