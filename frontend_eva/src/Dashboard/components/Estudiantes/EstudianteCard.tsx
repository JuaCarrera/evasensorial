import React from 'react'
import { Calendar, Mail, BookOpen, UserIcon, UserPlus, Edit, Trash2 } from 'lucide-react'
import type { EstudianteUI } from '../../services/estudiantes.service'
import { calculateAge, getStatusColor, getProgressColor, fmtDate } from './utils'

interface Props {
  estudiante: EstudianteUI
  terapeutas: any[]
  asignando: number | null
  onAsignar: (id: number, terapeutaId: number) => void
  onOpenModal: (mode: 'view' | 'edit', est: EstudianteUI) => void
  onDelete: (id: number, nombre?: string) => void
}

const EstudianteCard: React.FC<Props> = ({
  estudiante, terapeutas, asignando, onAsignar, onOpenModal, onDelete
}) => {
  const t = estudiante.terapeuta_id
    ? terapeutas.find(tt => tt.terapeuta_id === estudiante.terapeuta_id)
    : null

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-purple-700/30">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-xl">
            {(estudiante.nombres || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-white font-semibold">{estudiante.nombres} {estudiante.apellidos}</h3>
            <p className="text-purple-300 text-sm">
              {calculateAge(estudiante.fechaNacimiento) ?? '—'} años • {estudiante.grado || '—'} • {estudiante.colegio || '—'}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(estudiante.status)}`}>
          {estudiante.status}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-purple-300 text-sm">Progreso</span>
          <span className="text-white font-medium">{estudiante.progress ?? 0}%</span>
        </div>
        <div className="w-full bg-purple-900/50 rounded-full h-2">
          <div className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(estudiante.progress ?? 0)}`} style={{ width: `${estudiante.progress ?? 0}%` }}></div>
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center gap-2 text-purple-300">
          <Mail className="w-4 h-4" /><span className="text-white">{estudiante.email || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-purple-300">
          <Calendar className="w-4 h-4" /><span className="text-white">{fmtDate(estudiante.fechaNacimiento)}</span>
        </div>
        <div className="flex items-center gap-2 text-purple-300">
          <BookOpen className="w-4 h-4" /><span className="text-white">{estudiante.grado || '—'} • {estudiante.colegio || '—'}</span>
        </div>
        {t && (
          <div className="flex items-center gap-2 text-purple-300">
            <UserIcon className="w-4 h-4" />
            <span className="text-white">Terapeuta: {t.nombre}</span>
          </div>
        )}
      </div>

      {/* Asignar terapeuta */}
      <div className="mt-3">
        <label className="block text-purple-300 text-sm mb-1 flex items-center gap-1">
          <UserPlus className="w-4 h-4" /> Terapeuta
        </label>
        {estudiante.terapeuta_id ? (
          <p className="text-white text-sm">Ya asignado</p>
        ) : (
          <select
            className="w-full bg-purple-800/40 border border-purple-700/50 rounded-lg px-3 py-2 text-white"
            onChange={(ev) => onAsignar(estudiante.id, Number(ev.target.value))}
            defaultValue=""
            disabled={asignando === estudiante.id}
          >
            <option value="" disabled>Seleccionar...</option>
            {terapeutas.map((t) => (
              <option key={t.terapeuta_id} value={t.terapeuta_id}>
                {t.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex space-x-2 mt-4">
        <button onClick={() => onOpenModal('view', estudiante)} className="flex-1 bg-purple-600/50 hover:bg-purple-600 text-white py-2 px-3 rounded-lg text-sm">
          Ver
        </button>
        <button onClick={() => onOpenModal('edit', estudiante)} className="flex items-center justify-center bg-blue-600/50 hover:bg-blue-600 text-white p-2 rounded-lg">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(estudiante.id, `${estudiante.nombres} ${estudiante.apellidos}`)} className="flex items-center justify-center bg-red-600/50 hover:bg-red-600 text-white p-2 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default React.memo(EstudianteCard)
