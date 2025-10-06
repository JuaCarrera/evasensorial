// src/Dashboard/services/registro.service.ts
import { http } from './http'

export type TipoUsuario = 'familiar' | 'profesor'

export interface RegistroParticipantePayload {
  tipo_usuario: TipoUsuario
  codigo_acceso: string
  documento_identificacion: string
  nombre?: string
  email?: string
  parentesco?: string   // solo familiar
  materia?: string      // solo profesor
  expira_min?: number   // default 1440
}

export interface RegistroParticipanteResponse {
  token: string
  tipo_usuario: TipoUsuario
  participante_id: number
  estudiante_id: number
  expira_en: string // ISO date-time
}

export interface TokenResponse {
  token: string
  tipo_usuario: TipoUsuario
  estudiante_id: number
  expira_en: string // ISO date-time
}

export interface EstadoPorTokenResponse {
  participante?: {
    id: number
    nombre?: string
    email?: string
    documento_identificacion?: string
  }
  estudiante?: {
    id: number
    nombres?: string
    apellidos?: string
    email?: string
    codigo_acceso?: string
  }
  respuestas_temporales?: Array<{
    pregunta_id: number
    respuesta: string
  }>
  creado_en?: string
  expira_en?: string
}

export interface GuardarParticipanteTemporalPayload {
  data: Record<string, any>
}

export interface RespuestaUnitPayload {
  pregunta_id: number
  respuesta: string
}

export interface RespuestaBatchPayload {
  respuestas: RespuestaUnitPayload[]
}

const IDEMPOTENCY = () => ({ 'Idempotency-Key': crypto.randomUUID() })

function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    usp.set(k, String(v))
  })
  const s = usp.toString()
  return s ? `?${s}` : ''
}

/** POST /registro/participante */
export async function registrarParticipante(payload: RegistroParticipantePayload) {
  return http<RegistroParticipanteResponse>('/registro/participante', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: IDEMPOTENCY(),
  })
}

/**
 * GET /registro/token?documento_identificacion=...
 * (Soporta también ?codigo_acceso=... si el backend lo permite)
 */
export async function getTokenPorCedula(params: {
  documento_identificacion: string
  codigo_acceso?: string
}) {
  const url = `/registro/token${qs({
    documento_identificacion: params.documento_identificacion,
    codigo_acceso: params.codigo_acceso,
  })}`
  return http<TokenResponse>(url, { method: 'GET' })
}

/** GET /registro/estado/:token */
export async function getEstadoPorToken(token: string) {
  return http<EstadoPorTokenResponse>(`/registro/estado/${encodeURIComponent(token)}`, {
    method: 'GET',
  })
}

/** POST /registro/estado/:token/participante */
export async function guardarParticipanteTemporal(token: string, data: Record<string, any>) {
  return http(`/registro/estado/${encodeURIComponent(token)}/participante`, {
    method: 'POST',
    body: JSON.stringify({ data }),
    headers: IDEMPOTENCY(),
  })
}

/** POST /registro/estado/:token/respuestas (unit/batch) */
export async function guardarRespuestasTemporales(
  token: string,
  payload: RespuestaUnitPayload | RespuestaBatchPayload
) {
  return http(`/registro/estado/${encodeURIComponent(token)}/respuestas`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: IDEMPOTENCY(),
  })
}

/** POST /registro/estado/:token/finalizar */
export async function finalizarToken(token: string) {
  return http(`/registro/estado/${encodeURIComponent(token)}/finalizar`, {
    method: 'POST',
    headers: IDEMPOTENCY(),
  })
}

/* ===== Local token helpers (opcional) ===== */
const TOKEN_KEY = 'eva_registro_token'
export function saveLocalToken(token: string) { try { localStorage.setItem(TOKEN_KEY, token) } catch {} }
export function readLocalToken(): string | null { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }
export function clearLocalToken() { try { localStorage.removeItem(TOKEN_KEY) } catch {} }
