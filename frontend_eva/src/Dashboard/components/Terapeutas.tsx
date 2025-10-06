// src/Dashboard/components/Terapeutas.tsx
import React, { useMemo, useState } from 'react'
import {
  Plus, Search, Filter, Mail, Phone, MapPin, Edit, Trash2, X, Save, User, ShieldCheck,TreeDeciduous, Copy,CheckCircle, XCircle
} from 'lucide-react'
import { useTerapeutas } from '../hooks/useTerapeutas'
import type { TerapeutaDTO } from '../services/terapeutas.service'
import { generateRandomPassword } from '../utils/password'
import { toast } from 'react-toastify'

type ModalMode = 'add' | 'edit' | 'view'

// FormState: todos los campos editables del DTO (sin el id)
type FormState = Omit<TerapeutaDTO, 'terapeuta_id'> & { password?: string }

const emptyForm: FormState = {
  nombre: '',
  email: '',
  es_superadmin: false,
  Cargo: '',
  identificacion: '',
  especialidad: '',
  telefono: '',
  ubicacion: '',
  estado: 'Activo',
  password: undefined,
}



export const Terapeutas: React.FC = () => {
  const { items, loading, error, add, update, remove } = useTerapeutas()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'Todos' | 'Activo' | 'Inactivo' | 'Vacaciones'>('Todos')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('add')
  const [formData, setFormData] = useState<FormState>(emptyForm)
  const [selected, setSelected] = useState<TerapeutaDTO | null>(null)

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return items.filter(t => {
      const matchesSearch =
        t.nombre.toLowerCase().includes(term) ||
        t.especialidad.toLowerCase().includes(term) ||
        t.Cargo.toLowerCase().includes(term) ||
        t.email.toLowerCase().includes(term)
      const matchesStatus = selectedStatus === 'Todos' || t.estado === selectedStatus
      return matchesSearch && matchesStatus
    })
  }, [items, searchTerm, selectedStatus])

  const openModal = (mode: ModalMode, terapeuta?: TerapeutaDTO) => {
    setModalMode(mode)
    if (terapeuta) {
      setSelected(terapeuta)
      setFormData({
        nombre: terapeuta.nombre,
        email: terapeuta.email,
        es_superadmin: terapeuta.es_superadmin,
        Cargo: terapeuta.Cargo,
        identificacion: terapeuta.identificacion,
        especialidad: terapeuta.especialidad,
        telefono: terapeuta.telefono,
        ubicacion: terapeuta.ubicacion,
        estado: terapeuta.estado,
      })
    } else {
      setSelected(null)
      setFormData(emptyForm)
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelected(null)
    setFormData(emptyForm)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const toastCopyablePassword = (password: string) => {
    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(password)
        toast.dismiss() // cierra el toast actual
        toast.success('Contraseña copiada al portapapeles')
      } catch {
        toast.error('No se pudo copiar la contraseña')
      }
    }

    toast.success(
      <div className="space-y-1">
        <strong>Terapeuta creado.</strong>
        <div className="flex items-center gap-2">
          <code className="px-2 py-0.5 bg-white/10 rounded">{password}</code>
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-600/70 hover:bg-purple-600 transition"
          >
            <Copy className="w-4 h-4" />
            Copiar
          </button>
        </div>
      </div>,
      { autoClose: 8000 }
    )
  }

  const handleSave = async () => {
    try {
      if (modalMode === 'add') {
        const randomPassword = generateRandomPassword(12)
        await toast.promise(
          add({ ...formData, password: randomPassword }),
          {
            pending: 'Creando terapeuta…',
            success: 'Terapeuta creado',
            error: {
              render({ data }: any) {
                return data?.message ?? 'Error al crear terapeuta'
              }
            }
          }
        )
        toastCopyablePassword(randomPassword)
      } else if (modalMode === 'edit' && selected?.terapeuta_id) {
        await toast.promise(
          update(selected.terapeuta_id, { ...formData, password: undefined }),
          {
            pending: 'Actualizando…',
            success: 'Terapeuta actualizado correctamente',
            error: {
              render({ data }: any) {
                return data?.message ?? 'Error al actualizar terapeuta'
              }
            }
          }
        )
      }
      closeModal()
    } catch (e: any) {
      toast.error(e.message ?? 'Error al guardar')
    }
  }

const handleDelete = (id: number, nombre?: string) => {
  toast(
    ({ closeToast }) => (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-400" />
          <span className="font-semibold">¿Eliminar terapeuta?</span>
        </div>
        {nombre && (
          <p className="text-sm text-purple-200/90">
            {nombre}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => {
              closeToast();
              // Progreso + resultado con tu paleta
              toast.promise(
                remove(id),
                {
                  pending: 'Eliminando…',
                  success: 'Terapeuta eliminado',
                  error: {
                    render({ data }: any) {
                      return data?.message ?? 'Error al eliminar terapeuta';
                    }
                  }
                }
              );
            }}
            className="px-3 py-1.5 rounded bg-red-600/80 hover:bg-red-600 text-white"
          >
            Eliminar
          </button>

          <button
            onClick={closeToast}
            className="px-3 py-1.5 rounded bg-purple-600/60 hover:bg-purple-600 text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    ),
    { autoClose: false, closeOnClick: false } // permanece abierto hasta elegir
  );
};

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Activo': return 'bg-green-500/20 text-green-400'
      case 'Inactivo': return 'bg-red-500/20 text-red-400'
      case 'Vacaciones': return 'bg-yellow-500/20 text-yellow-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

const getStatusIcon = (estado: string) => {
  switch (estado) {
    case 'Activo':
      return <CheckCircle className="inline w-4 h-4 text-green-400 mr-1" />;
    case 'Vacaciones':
      return <TreeDeciduous className="inline w-4 h-4 text-yellow-400 mr-1" />;
    case 'Inactivo':
      return <XCircle className="inline w-4 h-4 text-red-400 mr-1" />;
    default:
      return null;
  }
};
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Terapeutas</h2>
          <p className="text-purple-300">
            {loading ? 'Cargando…' : 'Administra el equipo de profesionales'}
          </p>
          {error && <p className="text-red-300 text-sm mt-1">{error}</p>}
        </div>
        <button
          onClick={() => openModal('add')}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Terapeuta</span>
        </button>
      </div>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-purple-700/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm">Total Terapeutas</p>
              <p className="text-2xl font-bold text-white">{items.length}</p>
            </div>
            <User className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-purple-700/30">
          <div className="flex items-center justify-between">
            <div>
              <CheckCircle className="w-4 h-4 text-green-400 mr-1" /><p className="text-purple-300 text-sm">Activos</p>
              <p className="text-2xl font-bold text-white">{items.filter(t => t.estado === 'Activo').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-purple-700/30">
          <div className="flex items-center justify-between">
            <div>
               <TreeDeciduous className="w-4 h-4 text-yellow-400 mr-1" /><p className="text-purple-300 text-sm">En Vacaciones</p>
              <p className="text-2xl font-bold text-white">{items.filter(t => t.estado === 'Vacaciones').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-purple-700/30">
          <div className="flex items-center justify-between">
            <div>
               <XCircle className="w-4 h-4 text-red-400 mr-1" /><p className="text-purple-300 text-sm">Inactivos</p>
              <p className="text-2xl font-bold text-white">{items.filter(t => t.estado === 'Inactivo').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-purple-700/30">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar terapeutas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg pl-10 pr-4 py-2 text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-purple-300" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Vacaciones">Vacaciones</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de terapeutas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((t) => (
          <div key={t.terapeuta_id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-purple-700/30 hover:bg-white/20 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-xl">
                  {t.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{t.nombre}</h3>
                  <p className="text-purple-300 text-sm">{t.Cargo}</p>
                  <p className="text-purple-400 text-xs">ID: {t.identificacion}</p>
                </div>
              </div>
                <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusColor(t.estado)}`}>
                {getStatusIcon(t.estado)}
                {t.estado}
                </span>

            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-purple-300 text-sm">
                <Mail className="w-4 h-4" />
                <span className="truncate">{t.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-purple-300 text-sm">
                <Phone className="w-4 h-4" />
                <span>{t.telefono}</span>
              </div>
              <div className="flex items-center space-x-2 text-purple-300 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{t.ubicacion}</span>
              </div>
              <div className="flex items-center space-x-2 text-purple-300 text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>{t.es_superadmin ? 'Superadmin' : 'Terapeuta'}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => openModal('view', t)}
                className="flex-1 bg-purple-600/50 hover:bg-purple-600 text-white py-2 px-3 rounded-lg text-sm transition-colors"
              >
                Ver Perfil
              </button>
              <button
                onClick={() => openModal('edit', t)}
                className="flex items-center justify-center bg-blue-600/50 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
            <button
                onClick={() => handleDelete(t.terapeuta_id, t.nombre)}
                className="flex items-center justify-center bg-red-600/50 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                >
                <Trash2 className="w-4 h-4" />
                </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-purple-600/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-purple-300" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No se encontraron terapeutas</h3>
          <p className="text-purple-300">Intenta modificar los filtros de búsqueda</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-purple-900/90 backdrop-blur-sm rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-purple-700/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {modalMode === 'add' ? 'Nuevo Terapeuta' :
                 modalMode === 'edit' ? 'Editar Terapeuta' : 'Detalles del Terapeuta'}
              </h3>
              <button onClick={closeModal} className="text-purple-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Nombre Completo</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  disabled={modalMode === 'view'}
                  className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  placeholder="Nombre completo del terapeuta"
                />
              </div>

              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Identificación</label>
                <input
                  type="text"
                  name="identificacion"
                  value={formData.identificacion}
                  onChange={handleInputChange}
                  disabled={modalMode === 'view'}
                  className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  placeholder="Número de identificación"
                />
              </div>

              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Cargo</label>
                <input
                  type="text"
                  name="Cargo"
                  value={formData.Cargo}
                  onChange={handleInputChange}
                  disabled={modalMode === 'view'}
                  className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  placeholder="Cargo o posición"
                />
              </div>

              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Especialidad</label>
                <input
                  type="text"
                  name="especialidad"
                  value={formData.especialidad}
                  onChange={handleInputChange}
                  disabled={modalMode === 'view'}
                  className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  placeholder="Especialidad"
                />
              </div>

              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={modalMode === 'view'}
                  className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  disabled={modalMode === 'view'}
                  className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  placeholder="+57 300 000 0000"
                />
              </div>

              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Ubicación</label>
                <input
                  type="text"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleInputChange}
                  disabled={modalMode === 'view'}
                  className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  placeholder="Ciudad o región"
                />
              </div>

              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Estado</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  disabled={modalMode === 'view'}
                  className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Vacaciones">Vacaciones</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="es_superadmin"
                  type="checkbox"
                  name="es_superadmin"
                  checked={!!formData.es_superadmin}
                  onChange={handleInputChange}
                  disabled={modalMode === 'view'}
                  className="h-4 w-4 accent-purple-500"
                />
                <label htmlFor="es_superadmin" className="text-purple-300 text-sm">Es superadmin</label>
              </div>
            </div>

            {modalMode !== 'view' && (
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={closeModal} className="px-4 py-2 text-purple-300 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSave} className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <Save className="w-4 h-4" />
                  <span>{modalMode === 'add' ? 'Crear' : 'Guardar'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
