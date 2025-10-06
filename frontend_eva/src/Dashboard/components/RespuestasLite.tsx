// src/Dashboard/components/RespuestasLite.tsx
import React, { useState } from 'react';
import { useEstudiantesPorTerapeuta } from '../hooks/useEstudiantesPorTerapeuta';
import { getRespuestasPorEstudiante, Respuesta } from '../services/respuestas.service';
import { RespuestasGraficoInteractivo } from './RespuestasGraficoInteractivo';
import { toast } from 'react-toastify';

export const RespuestasLite: React.FC = () => {
  const { items: estudiantes, loading: loadingEstudiantes, error: errorEstudiantes } =
    useEstudiantesPorTerapeuta();

  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [selectedEstudiante, setSelectedEstudiante] = useState<{
    id: number;
    nombres: string;
    apellidos: string;
  } | null>(null);
  const [respondidoPor, setRespondidoPor] = useState<'familiar' | 'docente' | null>(null);

  const [loadingRespuestas, setLoadingRespuestas] = useState(false);
  const [errorRespuestas, setErrorRespuestas] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>(''); // sección activa

  const handleVerRespuestas = async (
    estudiante: { id: number; nombres: string; apellidos: string },
    respondido: 'familiar' | 'docente'
  ) => {
    setSelectedEstudiante(estudiante);
    setRespondidoPor(respondido);
    setLoadingRespuestas(true);
    setErrorRespuestas(null);
    setRespuestas([]);
    setActiveTab('');

    try {
      const data = await getRespuestasPorEstudiante(estudiante.id, respondido);
      setRespuestas(data || []);
      if (data.length > 0) {
        setActiveTab(data[0].seccion_titulo); // primera sección activa
      }
      toast.success(`Respuestas (${respondido}) cargadas para ${estudiante.nombres}`);
    } catch (err: any) {
      setErrorRespuestas(err.message || 'Error al obtener respuestas.');
      toast.error('Error al obtener respuestas');
    } finally {
      setLoadingRespuestas(false);
    }
  };

  // 👇 Agrupación por secciones
  const respuestasPorSeccion = respuestas.reduce((acc, r) => {
    if (!acc[r.seccion_titulo]) acc[r.seccion_titulo] = [];
    acc[r.seccion_titulo].push(r);
    return acc;
  }, {} as Record<string, Respuesta[]>);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Respuestas de Mis Estudiantes</h2>

      {/* Tabla estudiantes */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        {errorEstudiantes ? (
          <p className="p-4 text-red-500">Error cargando estudiantes: {errorEstudiantes}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-800">
              <thead className="bg-purple-900 text-white">
                <tr>
                  <th className="px-6 py-3 text-left">Nombre</th>
                  <th className="px-6 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingEstudiantes ? (
                  <tr>
                    <td colSpan={2} className="text-center p-4">
                      Cargando estudiantes...
                    </td>
                  </tr>
                ) : estudiantes.length > 0 ? (
                  estudiantes.map((est) => (
                    <tr key={est.id} className="border-b">
                      <td className="px-6 py-4">
                        {est.nombres} {est.apellidos}
                      </td>
                      <td className="px-6 py-4 flex flex-wrap gap-2">
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          onClick={() =>
                            handleVerRespuestas(
                              { id: est.id, nombres: est.nombres, apellidos: est.apellidos },
                              'familiar'
                            )
                          }
                        >
                          Ver como Familiar
                        </button>
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          onClick={() =>
                            handleVerRespuestas(
                              { id: est.id, nombres: est.nombres, apellidos: est.apellidos },
                              'docente'
                            )
                          }
                        >
                          Ver como Docente
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center p-4 text-purple-500">
                      No tienes estudiantes asignados todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Respuestas */}
      {selectedEstudiante && (
        <div className="mt-10">
          <h3 className="text-xl font-semibold text-white mb-4">
            Respuestas de {selectedEstudiante.nombres} {selectedEstudiante.apellidos}{' '}
            {respondidoPor && <span className="text-purple-300">(Respondido por {respondidoPor})</span>}
          </h3>

          {loadingRespuestas ? (
            <p className="text-white">Cargando respuestas...</p>
          ) : errorRespuestas ? (
            <p className="text-red-400">{errorRespuestas}</p>
          ) : respuestas.length > 0 ? (
            <>
              {/* Tabs de secciones */}
              <div className="flex flex-wrap gap-2 mb-4 border-b border-purple-700">
                {Object.keys(respuestasPorSeccion).map((seccion) => (
                  <button
                    key={seccion}
                    onClick={() => setActiveTab(seccion)}
                    className={`px-4 py-2 text-sm font-medium rounded-t ${
                      activeTab === seccion
                        ? 'bg-purple-800 text-white'
                        : 'bg-purple-600/50 text-gray-200 hover:bg-purple-600'
                    }`}
                  >
                    {seccion} ({respuestasPorSeccion[seccion].length})
                  </button>
                ))}
              </div>

              {/* Contenido dentro de la sección activa */}
              {activeTab && (
                <div className="bg-white shadow-md rounded-lg p-4">
                  {Object.entries(
                    respuestasPorSeccion[activeTab].reduce((acc, r) => {
                      if (!acc[r.modulo_titulo]) acc[r.modulo_titulo] = [];
                      acc[r.modulo_titulo].push(r);
                      return acc;
                    }, {} as Record<string, Respuesta[]>)
                  ).map(([modulo, respuestasModulo]) => (
                    <details key={modulo} className="mb-4 border border-purple-200 rounded">
                      <summary className="cursor-pointer bg-purple-700 text-white px-4 py-2 font-semibold rounded-t">
                        {modulo} ({respuestasModulo.length})
                      </summary>

                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-800">
                          <thead className="bg-purple-100 text-purple-900">
                            <tr>
                              <th className="px-4 py-2 text-left">#</th>
                              <th className="px-4 py-2 text-left">Pregunta</th>
                              <th className="px-4 py-2 text-left">Respuesta</th>
                              <th className="px-4 py-2 text-left">Fecha</th>
                            </tr>
                          </thead>
                          <tbody>
                            {respuestasModulo
                              .sort((a, b) => a.pregunta_orden - b.pregunta_orden)
                              .map((res, idx) => (
                                <tr key={res.respuesta_id} className="border-b">
                                  <td className="px-4 py-2">{idx + 1}</td>
                                  <td className="px-4 py-2">{res.pregunta_texto}</td>
                                  <td className="px-4 py-2">{res.respuesta}</td>
                                  <td className="px-4 py-2">
                                    {new Date(res.fecha).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  ))}
                </div>
              )}

              {/* Gráfico interactivo */}
              <RespuestasGraficoInteractivo
                respuestas={respuestas}
                estudiante={selectedEstudiante}
                respondidoPor={respondidoPor || undefined}
              />
            </>
          ) : (
            <p className="text-purple-500">No hay respuestas registradas para este estudiante.</p>
          )}
        </div>
      )}
    </div>
  );
};
