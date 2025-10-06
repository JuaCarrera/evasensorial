// src/Dashboard/services/formularios.service.ts
import { http } from './http';

export type ApiPregunta = {
  id?: number;                 // 👈 nuevo: id opcional que puede enviar tu API
  texto: string;
  tipo: 'likert_1_5';
  orden: number;
  opciones?: number[];
};

export type ApiModulo = {
  titulo: string;
  orden: number;
  preguntas: ApiPregunta[];
};

export type ApiSeccion = {
  titulo: string;
  orden: number;
  modulos: ApiModulo[];
};

export type ApiFormulario = {
  formulario_id?: number;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  destinatario: string;
  estado: string;
  version: number;
  secciones: ApiSeccion[];
};

export type ApiFormularioListItem = {
  id: number;
  nombre: string;
  estado: string;
  version: number;
  categoria?: string;
  destinatario?: string;
};

export async function createFormulario(dto: ApiFormulario) {
  return http<{ formulario_id: number }>('/formularios', {
    method: 'POST',
    body: JSON.stringify(dto),
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  });
}

export async function listFormularios() {
  return http<ApiFormularioListItem[]>('/formularios', { method: 'GET' });
}

export async function getFormulario(id: number | string) {
  return http<ApiFormulario>(`/formularios/${id}`, { method: 'GET' });
}

export async function updateFormulario(id: number | string, top: Partial<ApiFormulario>) {
  return http(`/formularios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(top),
  });
}

export async function deleteFormulario(id: number | string) {
  return http(`/formularios/${id}`, { method: 'DELETE' });
}
