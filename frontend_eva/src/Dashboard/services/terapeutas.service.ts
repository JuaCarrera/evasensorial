// src/services/terapeutas.service.ts
import { API_URL } from '../../config/api'

export interface TerapeutaDTO {
  terapeuta_id: number
  nombre: string
  email: string
  es_superadmin: boolean
  Cargo: string
  identificacion: string
  especialidad: string
  telefono: string
  ubicacion: string
  estado: 'Activo' | 'Inactivo' | 'Vacaciones'
}

export interface CreateTerapeutaDTO
  extends Omit<TerapeutaDTO, 'terapeuta_id'> {
  password?: string // la API la hashea
}

const base = `${API_URL}/terapeutas`

// --- helpers para leer token ---
function pickTokenFromObject(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null
  return (
    obj.token ||
    obj.accessToken ||
    obj.access_token ||
    obj.jwt ||
    null
  )
}

function normalizeRawToken(raw: string | null): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      return pickTokenFromObject(parsed)
    } catch {}
  }
  return trimmed.replace(/^"+|"+$/g, '') || null
}

function getAuthToken(): string | null {
  const sources = [
    () => localStorage.getItem('auth'),
    () => localStorage.getItem('token'),
    () => sessionStorage.getItem('auth'),
    () => sessionStorage.getItem('token'),
  ]
  for (const read of sources) {
    const tok = normalizeRawToken(read())
    if (tok) return tok
  }
  return null
}
// --- fin helpers ---

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const token = getAuthToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init?.headers || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(input, { ...init, headers })

  if (res.status === 401) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || 'No autorizado (401): token requerido o inválido')
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }

  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    // @ts-expect-error permitir vacío (e.g., 204)
    return undefined
  }
  return (await res.json()) as T
}

export const terapeutasService = {
  list(): Promise<TerapeutaDTO[]> {
    return http<TerapeutaDTO[]>(base)
  },
  create(data: CreateTerapeutaDTO): Promise<TerapeutaDTO> {
    return http<TerapeutaDTO>(base, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  update(id: number, data: Partial<CreateTerapeutaDTO>): Promise<TerapeutaDTO> {
    return http<TerapeutaDTO>(`${base}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  remove(id: number): Promise<{ ok: true }> {
    return http<{ ok: true }>(`${base}/${id}`, {
      method: 'DELETE',
    })
  },
}
