// src/Dashboard/components/EstudiantesLite.tsx
import React, { useState, useMemo } from 'react'
import { Mail, Calendar, BookOpen, User, Hash, Fingerprint, Search } from 'lucide-react'
import { useEstudiantesPorTerapeuta } from '../hooks/useEstudiantesPorTerapeuta'

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString() : '—')

export const EstudiantesLite: React.FC = () => {
  const { items, loading, error } = useEstudiantesPorTerapeuta()
  const [search, setSearch] = useState('')

  // 🔍 Filtro dinámico
  const filtrados = useMemo(() => {
    if (!search.trim()) return items
    const lower = search.toLowerCase()
    return items.filter(
      (e) =>
        e.nombres.toLowerCase().includes(lower) ||
        e.apellidos.toLowerCase().includes(lower) ||
        (e.email && e.email.toLowerCase().includes(lower)) ||
        (e.documentoIdentificacion && e.documentoIdentificacion.toLowerCase().includes(lower))
    )
  }, [search, items])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Mis Estudiantes Asignados</h2>
          <p className="text-purple-300">
            {loading ? 'Cargando…' : 'Listado de estudiantes vinculados a tu cuenta'}
          </p>
          {error && <p className="text-red-300 text-sm mt-1">{error}</p>}
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o documento..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/10 border border-purple-600/40 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtrados.map((e) => (
          <div
            key={e.id}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-purple-700/30 hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-xl">
                  {(e.nombres || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    {e.nombres} {e.apellidos}
                  </h3>
                  <p className="text-purple-300 text-sm">
                    {e.edad ? `${e.edad} años` : 'Edad no registrada'} • {e.grado} • {e.colegio}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-purple-300">
                <Mail className="w-4 h-4" />
                <span className="text-white">{e.email}</span>
              </div>

              <div className="flex items-center gap-2 text-purple-300">
                <Calendar className="w-4 h-4" />
                <span className="text-white">{fmt(e.fechaNacimiento)}</span>
              </div>

              <div className="flex items-center gap-2 text-purple-300">
                <BookOpen className="w-4 h-4" />
                <span className="text-white">{e.grado} • {e.colegio}</span>
              </div>

              <div className="flex items-center gap-2 text-purple-300">
                <Fingerprint className="w-4 h-4" />
                <span className="text-white">{e.documentoIdentificacion}</span>
              </div>

              {e.codigoAcceso && (
                <div className="flex items-center gap-2 text-purple-300">
                  <Hash className="w-4 h-4" />
                  <span className="text-white font-mono text-sm">
                    Código de acceso: {e.codigoAcceso}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje vacío */}
      {!loading && filtrados.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-white mb-2">No se encontraron estudiantes</h3>
          <p className="text-purple-300">Prueba cambiando el criterio de búsqueda</p>
        </div>
      )}
    </div>
  )
}
