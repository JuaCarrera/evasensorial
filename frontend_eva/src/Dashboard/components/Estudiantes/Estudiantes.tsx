import React, { useMemo, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useEstudiantes } from '../../hooks/useEstudiantes'
import { useTerapeutas } from '../../hooks/useTerapeutas'
import type { EstudianteUI } from '../../services/estudiantes.service'
import EstudianteCard from './EstudianteCard'
import EstudianteModal from './EstudianteModal'
import { toast } from 'react-toastify'

export const Estudiantes: React.FC = () => {
  const { items, loading, error, add, update, remove, assignTerapeuta, refresh } = useEstudiantes()
  const { items: terapeutas } = useTerapeutas()

  const [asignando, setAsignando] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selected, setSelected] = useState<EstudianteUI | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] =
    useState<'Todos' | 'Activo' | 'Pausa' | 'Completado'>('Todos')

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return items.filter(e => {
      const matchesSearch =
        `${e.nombres} ${e.apellidos}`.toLowerCase().includes(term) ||
        (e.colegio || '').toLowerCase().includes(term) ||
        (e.email || '').toLowerCase().includes(term)
      const matchesStatus = selectedStatus === 'Todos' || e.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }, [items, searchTerm, selectedStatus])

  const handleAsignar = useCallback(async (estudianteId: number, terapeutaId: number) => {
    try {
      setAsignando(estudianteId)
      await assignTerapeuta(estudianteId, terapeutaId)
      await refresh()
      toast.success('✅ Terapeuta asignado correctamente')
    } catch (err: any) {
      toast.error(err.message || '❌ No se pudo asignar el terapeuta')
    } finally {
      setAsignando(null)
    }
  }, [assignTerapeuta, refresh])

  const handleOpenModal = useCallback((mode: 'add' | 'edit' | 'view', est?: EstudianteUI) => {
    setModalMode(mode)
    setSelected(est || null)
    setShowModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setSelected(null)
  }, [])

  const handleSave = useCallback(async (data: Partial<EstudianteUI>, id?: number) => {
    const payload = {
      nombres: data.nombres || '',
      apellidos: data.apellidos || '',
      email: data.email || '',
      numeroDocumento: data.numeroDocumento || '',
      fechaNacimiento: data.fechaNacimiento || '',
      grado: data.grado || '',
      colegio: data.colegio || '',
      therapist: data.therapist || '',
      progress: data.progress ?? 0,
      sessions: data.sessions ?? 0,
      nextSession: data.nextSession ?? '',
      status: data.status ?? 'Activo',
      tipoDocumento: data.tipoDocumento ?? 'Registro Civil',
      acudienteCorreo: data.acudienteCorreo || '',
      profesorCorreo: data.profesorCorreo || ''
    }

    try {
      if (modalMode === 'add') {
        await toast.promise(add(payload), {
          pending: 'Creando estudiante…',
          success: 'Estudiante creado',
          error: 'Error al crear estudiante'
        })
      } else if (modalMode === 'edit' && id) {
        await toast.promise(update(id, payload), {
          pending: 'Actualizando estudiante…',
          success: 'Estudiante actualizado',
          error: 'Error al actualizar estudiante'
        })
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Error al guardar')
    }
  }, [modalMode, add, update])

  const handleDelete = useCallback(async (id: number, nombre?: string) => {
    toast(({ closeToast }) => (
      <div className="space-y-2">
        <p className="font-semibold text-white">¿Eliminar estudiante?</p>
        {nombre && <p className="text-purple-200 text-sm">{nombre}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => {
              closeToast()
              toast.promise(remove(id), {
                pending: 'Eliminando…',
                success: 'Estudiante eliminado',
                error: 'Error al eliminar'
              })
            }}
            className="px-3 py-1 bg-red-600 text-white rounded"
          >
            Eliminar
          </button>
          <button
            onClick={closeToast}
            className="px-3 py-1 bg-gray-600 text-white rounded"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), { autoClose: false })
  }, [remove])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Estudiantes</h2>
          <p className="text-purple-300">{loading ? 'Cargando…' : 'Seguimiento del progreso y sesiones'}</p>
          {error && <p className="text-red-300 text-sm mt-1">{error}</p>}
        </div>
        <button
          onClick={() => handleOpenModal('add')}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Estudiante</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Buscar estudiante..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white"
        />
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as any)}
          className="bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white"
        >
          <option value="Todos">Todos</option>
          <option value="Activo">Activo</option>
          <option value="Pausa">Pausa</option>
          <option value="Completado">Completado</option>
        </select>
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((e) => (
          <EstudianteCard
            key={e.id}
            estudiante={e}
            terapeutas={terapeutas}
            asignando={asignando}
            onAsignar={handleAsignar}
            onOpenModal={handleOpenModal}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Modal */}
      <EstudianteModal
        show={showModal}
        mode={modalMode}
        estudiante={selected}
        terapeutas={terapeutas}
        onClose={handleCloseModal}
        onSave={handleSave}
      />
    </div>
  )
}
