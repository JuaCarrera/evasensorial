import React, { useEffect, useState } from 'react'
import { X, Save } from 'lucide-react'
import type { EstudianteUI } from '../../services/estudiantes.service'

interface Props {
  show: boolean
  mode: 'add' | 'edit' | 'view'
  estudiante: EstudianteUI | null
  terapeutas: { terapeuta_id: number; nombre: string }[]
  onClose: () => void
  onSave: (data: Partial<EstudianteUI>, id?: number) => void
}

const emptyForm: Partial<EstudianteUI> = {
  nombres: '',
  apellidos: '',
  email: '',
  numeroDocumento: '',
  fechaNacimiento: '',
  grado: '',
  colegio: '',
  therapist: '',
  status: 'Activo',
  tipoDocumento: 'Registro Civil',
  acudienteCorreo: '',
  profesorCorreo: ''
}

const calculateAge = (birthDate?: string) => {
  if (!birthDate) return ''
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const EstudianteModal: React.FC<Props> = ({ show, mode, estudiante, terapeutas, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<EstudianteUI>>(emptyForm)

  useEffect(() => {
    if (estudiante) {
      setFormData({
        nombres: estudiante.nombres,
        apellidos: estudiante.apellidos,
        email: estudiante.email,
        numeroDocumento: estudiante.numeroDocumento,
        fechaNacimiento: estudiante.fechaNacimiento,
        grado: estudiante.grado,
        colegio: estudiante.colegio,
        therapist: estudiante.therapist,
        status: estudiante.status,
        tipoDocumento: estudiante.tipoDocumento,
        acudienteCorreo: estudiante.acudienteCorreo,
        profesorCorreo: estudiante.profesorCorreo
      })
    } else {
      setFormData(emptyForm)
    }
  }, [estudiante])

  if (!show) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    onSave(formData, estudiante?.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-purple-900/90 backdrop-blur-sm rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-purple-700/30">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            {mode === 'add' ? 'Nuevo Estudiante' : mode === 'edit' ? 'Editar Estudiante' : 'Detalles del Estudiante'}
          </h3>
          <button onClick={onClose} className="text-purple-300 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-purple-300 text-sm mb-2">Nombres</label>
            <input
              type="text"
              name="nombres"
              value={formData.nombres || ''}
              onChange={handleChange}
              disabled={mode === 'view'}
              className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-purple-300 text-sm mb-2">Apellidos</label>
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos || ''}
              onChange={handleChange}
              disabled={mode === 'view'}
              className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-purple-300 text-sm mb-2">Correo</label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              disabled={mode === 'view'}
              className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-purple-300 text-sm mb-2">Número de Documento</label>
            <input
              type="text"
              name="numeroDocumento"
              value={formData.numeroDocumento || ''}
              onChange={handleChange}
              disabled={mode === 'view'}
              className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-purple-300 text-sm mb-2">Fecha de Nacimiento</label>
            <input
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento || ''}
              onChange={handleChange}
              disabled={mode === 'view'}
              className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-purple-300 text-sm mb-2">Edad</label>
            <input
              type="number"
              value={calculateAge(formData.fechaNacimiento) ?? ''}
              disabled
              className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white opacity-50"
            />
          </div>
          <div>
            <label className="block text-purple-300 text-sm mb-2">Grado</label>
            <input
              type="text"
              name="grado"
              value={formData.grado || ''}
              onChange={handleChange}
              disabled={mode === 'view'}
              className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-purple-300 text-sm mb-2">Colegio</label>
            <input
              type="text"
              name="colegio"
              value={formData.colegio || ''}
              onChange={handleChange}
              disabled={mode === 'view'}
              className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white disabled:opacity-50"
            />
          </div>

          {/* ✅ Correos extra */}
          <div>
            <label className="block text-purple-300 text-sm mb-2">Correo Acudiente</label>
            <input
              type="email"
              name="acudienteCorreo"
              value={formData.acudienteCorreo || ''}
              onChange={handleChange}
              disabled={mode === 'view'}
              className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-purple-300 text-sm mb-2">Correo Profesor</label>
            <input
              type="email"
              name="profesorCorreo"
              value={formData.profesorCorreo || ''}
              onChange={handleChange}
              disabled={mode === 'view'}
              className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white disabled:opacity-50"
            />
          </div>

          {mode !== 'view' && (
            <div className="md:col-span-2">
              <label className="block text-purple-300 text-sm mb-2">Terapeuta</label>
              <select
                name="therapist"
                value={formData.therapist || ''}
                onChange={handleChange}
                className="w-full bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Seleccionar...</option>
                {terapeutas.map((t) => (
                  <option key={t.terapeuta_id} value={t.nombre}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {mode !== 'view' && (
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-purple-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{mode === 'add' ? 'Crear' : 'Guardar'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default EstudianteModal
