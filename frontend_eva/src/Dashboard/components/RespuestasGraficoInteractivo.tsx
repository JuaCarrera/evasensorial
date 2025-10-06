import React, { useMemo, useEffect, useState, useRef } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, ZAxis
} from 'recharts';
import { useCurrentPng } from 'recharts-to-png';
import FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { Respuesta } from '../services/respuestas.service';
import { toast } from 'react-toastify';
import { DownloadCloud, FileSpreadsheet, Printer } from 'lucide-react';

type Nivel = 'Bajo' | 'Normal' | 'Bien';

const getColorByNivel = (nivel: Nivel) => {
  if (nivel === 'Bajo') return '#EF4444';   // rojo
  if (nivel === 'Normal') return '#F59E0B'; // ámbar
  return '#10B981';                         // verde
};

const calcularNivel = (prom: number): Nivel => {
  if (prom <= 2) return 'Bajo';
  if (prom < 4) return 'Normal';
  return 'Bien';
};

interface PointData {
  x: number;          // orden en X (1..N)
  y: number;          // promedio 1..5
  size: number;       // tamaño de burbuja = cantidad
  label: string;      // nombre (módulo/ sección / módulo(sección))
  cantidad: number;
  nivel: Nivel;
  seccion?: string;   // para vista general
  modulo?: string;    // para vista módulos
}

export const RespuestasGraficoInteractivo: React.FC<{ respuestas: Respuesta[] }> = ({ respuestas, estudiante, respondidoPor }) => {
  const [viewMode, setViewMode] = useState<'seccion' | 'modulo' | 'general'>('modulo');
  const [selectedSeccion, setSelectedSeccion] = useState<string>('');
  const [selectedModulo, setSelectedModulo] = useState<string>(''); // opcional
  const containerRef = useRef<HTMLDivElement>(null);

  // listas únicas
  const secciones = useMemo(
    () => Array.from(new Set(respuestas.map((r) => r.seccion_titulo))),
    [respuestas]
  );

  // módulos de la sección seleccionada
  const modulosDeSeccion = useMemo(() => {
    if (!selectedSeccion) return [];
    return Array.from(
      new Set(
        respuestas
          .filter((r) => r.seccion_titulo === selectedSeccion)
          .map((r) => r.modulo_titulo)
      )
    );
  }, [respuestas, selectedSeccion]);

  // orden si backend lo provee
  const getSeccionOrden = (seccion: string) => {
    const found = respuestas.find(
      (r) => r.seccion_titulo === seccion && (r as any).seccion_orden != null
    ) as any;
    return found?.seccion_orden as number | undefined;
  };
  const getModuloOrden = (modulo: string, seccion?: string) => {
    const found = respuestas.find(
      (r) =>
        r.modulo_titulo === modulo &&
        (seccion ? r.seccion_titulo === seccion : true) &&
        (r as any).modulo_orden != null
    ) as any;
    return found?.modulo_orden as number | undefined;
  };

  // dataset para gráfico/tabla
  const data = useMemo<PointData[]>(() => {
    const map = new Map<
      string,
      { suma: number; cantidad: number; seccion?: string; modulo?: string; xOrder?: number }
    >();

    respuestas.forEach((r) => {
      const val = parseFloat(r.respuesta) || 0;

      if (viewMode === 'seccion') {
        const key = r.seccion_titulo;
        const cur = map.get(key) || { suma: 0, cantidad: 0, xOrder: undefined };
        cur.suma += val;
        cur.cantidad += 1;
        const ord = getSeccionOrden(r.seccion_titulo);
        if (ord != null) cur.xOrder = ord;
        map.set(key, cur);
      } else if (viewMode === 'modulo') {
        if (!selectedSeccion || r.seccion_titulo !== selectedSeccion) return;
        if (selectedModulo && r.modulo_titulo !== selectedModulo) return;

        const key = r.modulo_titulo;
        const cur =
          map.get(key) || { suma: 0, cantidad: 0, seccion: r.seccion_titulo, modulo: r.modulo_titulo, xOrder: undefined };
        cur.suma += val;
        cur.cantidad += 1;
        const ord = getModuloOrden(r.modulo_titulo, r.seccion_titulo);
        if (ord != null) cur.xOrder = ord;
        map.set(key, cur);
      } else {
        // general: módulo(sección)
        const key = `${r.modulo_titulo} (${r.seccion_titulo})`;
        const cur =
          map.get(key) || { suma: 0, cantidad: 0, seccion: r.seccion_titulo, modulo: r.modulo_titulo, xOrder: undefined };
        cur.suma += val;
        cur.cantidad += 1;
        const ord = getModuloOrden(r.modulo_titulo, r.seccion_titulo);
        if (ord != null) cur.xOrder = ord;
        map.set(key, cur);
      }
    });

    const entries = Array.from(map.entries()).map(([label, v]) => {
      const y = v.suma / v.cantidad;
      return { label, y, cantidad: v.cantidad, seccion: v.seccion, modulo: v.modulo, xOrder: v.xOrder };
    });

    entries.sort((a, b) => {
      if (a.xOrder != null && b.xOrder != null) return a.xOrder - b.xOrder;
      if (a.xOrder != null) return -1;
      if (b.xOrder != null) return 1;
      return a.label.localeCompare(b.label);
    });

    return entries.map((e, i) => ({
      x: i + 1,
      y: e.y,
      size: e.cantidad,
      label: e.label,
      cantidad: e.cantidad,
      nivel: calcularNivel(e.y),
      seccion: e.seccion,
      modulo: e.modulo,
    }));
  }, [respuestas, viewMode, selectedSeccion, selectedModulo]);

  // defaults
  useEffect(() => {
    if (viewMode === 'modulo' && secciones.length > 0 && !selectedSeccion) {
      setSelectedSeccion(secciones[0]);
    }
  }, [viewMode, secciones, selectedSeccion]);

  useEffect(() => {
    // si cambio de sección, reinicio módulo seleccionado
    setSelectedModulo('');
  }, [selectedSeccion]);

  // alertas
  useEffect(() => {
    const low = data.filter((d) => d.nivel === 'Bajo').length;
    if (low > 0) toast.warning(`Atención: ${low} indicador(es) en zona crítica (≤2).`);
  }, [data]);

  // exportaciones
  const [getPng, { ref, isLoading }] = useCurrentPng();
  const handleDownloadPNG = async () => {
    const png = await getPng();
    if (png) {
      FileSaver.saveAs(png, `resumen_${viewMode}_${Date.now()}.png`);
      toast.success('Gráfico descargado como imagen.');
    }
  };
  const handleExportExcel = () => {
    const sheetData = data.map((d) => ({
      Vista: viewMode,
      Sección: d.seccion || (viewMode === 'seccion' ? d.label : ''),
      Módulo: d.modulo || (viewMode !== 'general' ? d.label : ''),
      Etiqueta: d.label,
      '# Preguntas': d.cantidad,
      Promedio: d.y.toFixed(2),
      Nivel: d.nivel,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    FileSaver.saveAs(new Blob([buf]), `resumen_${viewMode}_${Date.now()}.xlsx`);
    toast.success('Resumen exportado a Excel.');
  };
  const handleExportPDF = () => {
    if (containerRef.current) {
      const exportArea = containerRef.current.cloneNode(true) as HTMLElement;
      exportArea.querySelectorAll('button').forEach((btn) => btn.remove());
      exportArea.querySelectorAll('select').forEach((sel) => sel.remove());
      const header = document.createElement('div');
      header.style.textAlign = 'center';
      header.style.marginBottom = '20px';
      header.innerHTML = `
        <h2 style="color: #4C1D95; font-size: 20px;">Reporte ${viewMode}</h2>
        ${estudiante ? `<p><b>Estudiante:</b> ${estudiante.nombres} ${estudiante.apellidos}</p>` : ''}
        ${respondidoPor ? `<p><b>Respondido por:</b> ${respondidoPor}</p>` : ''}
        ${selectedSeccion ? `<p><b>Sección:</b> ${selectedSeccion}</p>` : ''}
        ${selectedModulo ? `<p><b>Módulo:</b> ${selectedModulo}</p>` : ''}
        <p style="font-size: 12px; color: #555;">Generado el ${new Date().toLocaleDateString()}</p>
      `;
      exportArea.insertBefore(header, exportArea.firstChild);
      exportArea.querySelectorAll('svg').forEach((svg) => {
        (svg as any).setAttribute('width', '900');
        (svg as any).setAttribute('height', '500');
      });
      html2pdf().set({
        filename: `reporte_${estudiante ? estudiante.nombres : 'anon'}_${respondidoPor || ''}_${Date.now()}.pdf`,
        margin: [15, 10, 15, 10],
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'landscape' },
      }).from(exportArea).save();
    }
  };


  // narrativa clínica (prosa continua)
  const narrativaClinica = useMemo(() => {
    if (data.length === 0) return '';

    const tituloSeccion =
      viewMode === 'modulo'
        ? selectedSeccion
          ? ` de la sección “${selectedSeccion}”`
          : ''
        : '';

    const intro =
      viewMode === 'seccion'
        ? 'Se analizó el desempeño global por secciones del instrumento, considerando promedios de 1 a 5.'
        : viewMode === 'modulo'
        ? `Se evaluó el rendimiento por módulos${tituloSeccion}, con promedios entre 1 y 5.`
        : 'Se integró el desempeño de todos los módulos del instrumento, agrupados por sección, con promedios de 1 a 5.';

    const bajos = data.filter((d) => d.nivel === 'Bajo');
    const normales = data.filter((d) => d.nivel === 'Normal');
    const buenos = data.filter((d) => d.nivel === 'Bien');

    const listar = (arr: PointData[]) =>
      arr
        .map((d) => `${d.label} (${d.y.toFixed(2)})`)
        .join('; ');

    const pBajo =
      bajos.length > 0
        ? `Se identifican áreas con promedio bajo (≤2), que sugieren dificultad significativa y priorización en la intervención: ${listar(bajos)}.`
        : 'No se identifican áreas en nivel bajo (≤2), lo cual reduce la probabilidad de limitaciones severas en los dominios evaluados.';

    const pNormal =
      normales.length > 0
        ? `Se observan dominios en rango intermedio (2–<4), compatibles con desempeño variable o en consolidación: ${listar(normales)}. Se recomienda seguimiento para favorecer progresión.`
        : 'No se evidencian dominios en rango intermedio; el desempeño se concentra en extremos (adecuado o bajo).';

    const pBien =
      buenos.length > 0
        ? `Se reconocen fortalezas con promedios elevados (≥4) en: ${listar(buenos)}. Estas áreas pueden servir como base para estrategias de refuerzo.`
        : 'No se observan promedios elevados (≥4) en los dominios evaluados.';

    const cierre =
      bajos.length > 0
        ? 'En conclusión, se sugiere priorizar las áreas en nivel bajo con un plan de intervención específico y reevaluación en el corto plazo (4–6 semanas), manteniendo seguimiento de los dominios en rango intermedio.'
        : 'En conclusión, se recomienda mantener y reforzar las áreas con buen desempeño, con reevaluación periódica para verificar la estabilidad del progreso.';

    return `${intro} ${pBajo} ${pNormal} ${pBien} ${cierre}`;
  }, [data, viewMode, selectedSeccion]);

  return (
    <div ref={containerRef} className="bg-white p-6 rounded-lg shadow-md mt-8">
      {/* Header y controles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <h3 className="text-xl font-bold text-purple-900">
          {viewMode === 'seccion'
            ? 'Resumen por Sección'
            : viewMode === 'modulo'
            ? 'Resumen por Módulos de una Sección'
            : 'Resumen General por Módulos'}
        </h3>
 {estudiante && <p className="text-sm text-purple-700">Estudiante: {estudiante.nombres} {estudiante.apellidos} {respondidoPor && `(Respondido por ${respondidoPor})`}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={`px-2 py-1 text-sm rounded-full ${viewMode === 'seccion' ? 'bg-blue-600 text-white' : 'border border-blue-400 text-blue-600'}`}
            onClick={() => setViewMode('seccion')}
          >
            Sección
          </button>
          <button
            className={`px-2 py-1 text-sm rounded-full ${viewMode === 'modulo' ? 'bg-blue-600 text-white' : 'border border-blue-400 text-blue-600'}`}
            onClick={() => setViewMode('modulo')}
          >
            Módulos por Sección
          </button>
          <button
            className={`px-2 py-1 text-sm rounded-full ${viewMode === 'general' ? 'bg-blue-600 text-white' : 'border border-blue-400 text-blue-600'}`}
            onClick={() => setViewMode('general')}
          >
            General
          </button>

          {/* Selectores */}
          {viewMode === 'modulo' && (
            <>
              <select
                value={selectedSeccion}
                onChange={(e) => setSelectedSeccion(e.target.value)}
                className="bg-purple-100 border border-purple-300 rounded px-2 py-1 text-sm text-purple-900"
              >
                {secciones.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>

              <select
                value={selectedModulo}
                onChange={(e) => setSelectedModulo(e.target.value)}
                className="bg-purple-100 border border-purple-300 rounded px-2 py-1 text-sm text-purple-900"
              >
                <option value="">Todos los módulos</option>
                {modulosDeSeccion.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </>
          )}

          <button
            className="bg-purple-600 text-white px-2 py-1 text-sm rounded flex items-center gap-1"
            onClick={handleDownloadPNG}
            disabled={isLoading}
          >
            <DownloadCloud size={16} /> PNG
          </button>
          <button
            className="bg-green-600 text-white px-2 py-1 text-sm rounded flex items-center gap-1"
            onClick={handleExportExcel}
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            className="bg-red-600 text-white px-2 py-1 text-sm rounded flex items-center gap-1"
            onClick={handleExportPDF}
          >
            <Printer size={16} /> PDF
          </button>
        </div>
      </div>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart ref={ref}>
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            type="number"
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
            tickCount={Math.max(2, data.length)}
            label={{ value: 'Orden', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            dataKey="y"
            domain={[0.5, 5.5]}
            ticks={[1, 2, 3, 4, 5]}
            label={{ value: 'Promedio (1–5)', angle: -90, position: 'insideLeft' }}
          />
          <ZAxis dataKey="size" range={[60, 260]} />

          {/* Guías clínicas */}
          <ReferenceLine y={2} stroke="#F59E0B" strokeDasharray="5 5" />
          <ReferenceLine y={4} stroke="#10B981" strokeDasharray="5 5" />

          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) =>
              active && payload && payload[0] ? (
                <div className="bg-white p-3 border rounded shadow text-sm">
                  <p className="font-bold">{payload[0].payload.label}</p>
                  {payload[0].payload.seccion && (
                    <p className="text-purple-700">Sección: {payload[0].payload.seccion}</p>
                  )}
                  <p>Promedio: {payload[0].payload.y.toFixed(2)}</p>
                  <p># Preguntas: {payload[0].payload.cantidad}</p>
                </div>
              ) : null
            }
          />

          {/* Jitter para separar niveles */}
          <Scatter
            name="Bajo"
            data={data.filter((d) => d.nivel === 'Bajo').map((d) => ({ ...d, x: d.x - 0.22 }))}
            fill={getColorByNivel('Bajo')}
          />
          <Scatter
            name="Normal"
            data={data.filter((d) => d.nivel === 'Normal').map((d) => ({ ...d, x: d.x }))}
            fill={getColorByNivel('Normal')}
          />
          <Scatter
            name="Bien"
            data={data.filter((d) => d.nivel === 'Bien').map((d) => ({ ...d, x: d.x + 0.22 }))}
            fill={getColorByNivel('Bien')}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Leyenda manual, sin duplicados */}
      <div className="flex flex-wrap justify-center gap-10 mt-3 text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: getColorByNivel('Bajo') }}></span> Bajo
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: getColorByNivel('Normal') }}></span> Normal
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: getColorByNivel('Bien') }}></span> Bien
        </span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full mt-6 text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2">Orden</th>
              <th className="px-3 py-2">
                {viewMode === 'seccion' ? 'Sección' : 'Módulo'}
              </th>
              {viewMode === 'general' && <th className="px-3 py-2">Sección</th>}
              <th className="px-3 py-2"># Preguntas</th>
              <th className="px-3 py-2">Promedio</th>
              <th className="px-3 py-2">Nivel</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-b">
                <td className="px-3 py-2">{d.x}</td>
                <td className="px-3 py-2">{d.label}</td>
                {viewMode === 'general' && <td className="px-3 py-2">{d.seccion}</td>}
                <td className="px-3 py-2">{d.cantidad}</td>
                <td className="px-3 py-2">{d.y.toFixed(2)}</td>
                <td className="px-3 py-2" style={{ color: getColorByNivel(d.nivel) }}>
                  {d.nivel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Informe clínico en prosa */}
      <div className="bg-purple-50 p-4 rounded-lg mt-6 text-sm text-gray-800">
        {narrativaClinica}
      </div>
    </div>
  );
};
