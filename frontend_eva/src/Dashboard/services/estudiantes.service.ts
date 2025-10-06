// src/services/estudiantes.service.ts
import { API_URL } from '../../config/api'

export interface EstudianteUI {
  id: number
  nombres: string
  apellidos: string
  email?: string
  numeroDocumento?: string
  fechaNacimiento?: string
  edad?: number
  grado?: string
  colegio?: string
  tipoDocumento?: 'Registro Civil' | 'Tarjeta de Identidad'
  therapist?: string
  terapeuta_id?: number   // ✅ agregado
  progress?: number
  sessions?: number
  nextSession?: string
  status?: 'Activo' | 'Pausa' | 'Completado'
  avatar?: string
  codigoAcceso?: string
  acudienteCorreo?: string
  profesorCorreo?: string
}

export type CreateEstudianteUI = Omit<EstudianteUI, 'id' | 'avatar' | 'edad' | 'codigoAcceso'>

const base = `${API_URL}/estudiantes`

function getAuthToken(): string | null {
  try { return localStorage.getItem('token') || null } catch { return null }
}

function getCurrentTerapeutaId(): number | null {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const obj = JSON.parse(raw)
    const u = obj?.user ?? obj?.data ?? obj
    return typeof u?.terapeuta_id === 'number' ? u.terapeuta_id : null
  } catch { return null }
}

function toApi(data: Partial<CreateEstudianteUI>, isCreate = false): Record<string, any> {
  const out: Record<string, any> = {
    nombre: data.nombres,
    apellidos: data.apellidos,
    email: data.email,
    documento_identificacion: data.numeroDocumento,
    fecha_nacimiento: data.fechaNacimiento,
    grado: data.grado,
    colegio: data.colegio,
  }

  if (isCreate && out['terapeuta_id'] == null) {
    const tid = getCurrentTerapeutaId()
    if (tid != null) out['terapeuta_id'] = tid
  }

  if (isCreate) {
    if (data.acudienteCorreo && data.acudienteCorreo.trim()) {
      out.familiares = [data.acudienteCorreo.trim()]
    }
    if (data.profesorCorreo && data.profesorCorreo.trim()) {
      out.profesores = [data.profesorCorreo.trim()]
    }
  }

  Object.keys(out).forEach(k => out[k] === undefined && delete out[k])
  return out
}

function fromApi(json: any): EstudianteUI {
  return {
    id: json.id ?? json.estudiante_id,
    nombres: json.nombre,
    apellidos: json.apellidos ?? '',
    email: json.email ?? '',
    numeroDocumento: json.documento_identificacion ?? '',
    fechaNacimiento: json.fecha_nacimiento ?? '',
    edad: json.edad ?? undefined,
    grado: json.grado ?? '',
    colegio: json.colegio ?? '',
    terapeuta_id: json.terapeuta_id ?? undefined,  // ✅ mapeado
    status: 'Activo',
    progress: 0,
    sessions: 0,
    nextSession: '',
    avatar: undefined,
    codigoAcceso: json.codigo_acceso ?? undefined,
  }
}

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(init?.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(input, { ...init, headers })
  if (res.status === 401) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || 'No autorizado (token requerido o inválido)')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    // @ts-expect-error: 204
    return undefined
  }
  return res.json() as Promise<T>
}

export const estudiantesService = {
  async list() {
    const data = await http<any[]>(base)
    return data.map(fromApi)
  },
  async create(payload: CreateEstudianteUI) {
    const body = toApi(payload, true)
    const created = await http<any>(base, { method: 'POST', body: JSON.stringify(body) })
    return fromApi({ ...payload, ...created, nombre: payload.nombres })
  },
  async update(id: number, patch: Partial<CreateEstudianteUI>) {
    const body = toApi(patch, false)
    const updated = await http<any>(`${base}/${id}`, { method: 'PUT', body: JSON.stringify(body) })
    return fromApi(updated)
  },
  async remove(id: number) {
    return http<{ ok: true }>(`${base}/${id}`, { method: 'DELETE' })
  },
  async resendCode(id: number, destinatarios: string[], regenerate = false) {
    return http<{ sent: true }>(`${base}/${id}/reenviar-codigo`, {
      method: 'POST',
      body: JSON.stringify({ destinatarios, regenerate }),
    })
  },
  linkFamiliarByCode(input: { email: string; nombre?: string; parentesco?: string; codigo_acceso: string }) {
    return http<{ linked: true }>(`${API_URL}/estudiantes/link/familiar`, {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { 'Content-Type': 'application/json' },
    })
  },
  linkProfesorByCode(input: { email: string; nombre?: string; materia?: string; codigo_acceso: string }) {
    return http<{ linked: true }>(`${API_URL}/estudiantes/link/profesor`, {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { 'Content-Type': 'application/json' },
    })
  },
}

export async function findEstudianteByDocumento(numeroDocumento: string) {
  return http<EstudianteUI>(`/estudiantes/buscar?numeroDocumento=${encodeURIComponent(numeroDocumento)}`, { method: 'GET' })
}

export async function asignarTerapeuta(estudianteId: number, terapeutaId: number) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/estudiantes/${estudianteId}/asignar-terapeuta`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({ terapeuta_id: terapeutaId }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => 'Error al asignar terapeuta');
    throw new Error(msg);
  }

  return await res.json();
}
