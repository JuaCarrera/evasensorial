// src/services/respuestas.service.ts
import { http } from './http';

export interface Respuesta {
  respuesta_id: number;
  estudiante_id: number;
  pregunta_id: number;
  respondido_por: string;
  usuario_id: number;
  respuesta: string;
  fecha: string;
  pregunta_texto: string;
  pregunta_tipo: string;
  pregunta_orden: number;
  modulo_titulo: string;
  seccion_titulo: string;
  formulario_nombre: string;
}

interface PagedResponse {
  estudiante_id: number;
  page: number;
  limit: number;
  total: number;
  rows: Respuesta[];
}

export const getRespuestasPorEstudiante = async (
  estudianteId: number,
  respondidoPor?: string // 👈 filtro opcional: "familiar" | "docente"
): Promise<Respuesta[]> => {
  let page = 1;
  const limit = 100; // 👈 sube el límite para traer más rápido
  let all: Respuesta[] = [];

  while (true) {
    const data = await http<PagedResponse>(
      `/respuestas/por-estudiante/${estudianteId}?page=${page}&limit=${limit}`
    );

    if (data?.rows?.length) {
      all = [...all, ...data.rows];
    }

    if (all.length >= data.total) break; // ya juntamos todas
    page++;
  }

  // 👇 aplicar filtro (si se pide)
  if (respondidoPor) {
    all = all.filter(r => r.respondido_por === respondidoPor);
  }

  console.log(`✅ Total respuestas cargadas: ${all.length}`);
  return all;
};
