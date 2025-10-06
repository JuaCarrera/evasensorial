// src/Dashboard/hooks/useRespuestas.ts
import { useState } from 'react';
import { getRespuestasPorEstudiante, Respuesta } from '../services/respuestas.service';

export const useRespuestas = () => {
  const [loading, setLoading] = useState(false);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetch = async (estudianteId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRespuestasPorEstudiante(estudianteId);
      setRespuestas(data);
    } catch (e: any) {
      setError(e.message || 'Error al cargar respuestas');
      setRespuestas([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    respuestas,
    loading,
    error,
    fetch,
  };
};
