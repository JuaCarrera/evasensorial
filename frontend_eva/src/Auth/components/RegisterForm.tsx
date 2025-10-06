// src/Auth/components/RegisterForm.tsx
import React, { useState, useEffect } from 'react'
import {
  User,
  Car as IdCard,
  BookOpen,
  Users,
  GraduationCap,
  ArrowLeft,
  Mail
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import InputField from './InputField'
import LoginButton from './LoginButton'
import { registrarParticipante } from '../services/registro.service'

interface FormData {
  userType: 'docente' | 'acudiente' | ''
  cedula: string
  nombres: string
  asignatura: string
  codigoEstudiante: string
  email: string
}

interface FormErrors {
  userType: string
  cedula: string
  nombres: string
  asignatura: string
  codigoEstudiante: string
  email: string
}

interface RegisterFormProps {
  onBackToLogin: () => void
}

const DEST_FORM_ID = 8 // redirige a /formulario/8

const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin }) => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState<FormData>({
    userType: '',
    cedula: '',
    nombres: '',
    asignatura: '',
    codigoEstudiante: '',
    email: '',
  })

  const [errors, setErrors] = useState<FormErrors>({
    userType: '',
    cedula: '',
    nombres: '',
    asignatura: '',
    codigoEstudiante: '',
    email: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => setIsVisible(true), [])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleUserTypeChange = (type: 'docente' | 'acudiente') => {
    setFormData(prev => ({
      ...prev,
      userType: type,
      asignatura: type === 'docente' ? prev.asignatura : '',
    }))
    setErrors({
      userType: '',
      cedula: '',
      nombres: '',
      asignatura: '',
      codigoEstudiante: '',
      email: '',
    })
  }

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      userType: '',
      cedula: '',
      nombres: '',
      asignatura: '',
      codigoEstudiante: '',
      email: '',
    }

    if (!formData.userType) newErrors.userType = 'Selecciona si eres docente o acudiente'

    if (!formData.cedula) newErrors.cedula = 'La cédula es requerida'
    else if (!/^\d{6,12}$/.test(formData.cedula))
      newErrors.cedula = 'La cédula debe tener 6–12 dígitos'

    if (!formData.nombres) newErrors.nombres = 'Los nombres completos son requeridos'
    else if (formData.nombres.trim().length < 3)
      newErrors.nombres = 'Mínimo 3 caracteres'

    if (formData.userType === 'docente' && !formData.asignatura)
      newErrors.asignatura = 'La asignatura es requerida para docentes'

    if (!formData.codigoEstudiante)
      newErrors.codigoEstudiante = 'El código del estudiante es requerido'
    else if (!/^[A-Z0-9]{4,12}$/.test(formData.codigoEstudiante.toUpperCase()))
      newErrors.codigoEstudiante = 'Código 4–12 alfanumérico (A–Z, 0–9)'

    if (!formData.email) newErrors.email = 'El correo es requerido'
    else if (!isValidEmail(formData.email))
      newErrors.email = 'Formato de correo no válido'

    setErrors(newErrors)
    return !Object.values(newErrors).some(Boolean)
  }

  const handleRegister = async () => {
    if (!validateForm()) return
    try {
      setIsLoading(true)

      const payload = {
        tipo_usuario: formData.userType === 'docente' ? 'profesor' : 'familiar',
        codigo_acceso: formData.codigoEstudiante.toUpperCase(),
        documento_identificacion: formData.cedula,
        nombre: formData.nombres,
        email: formData.email.trim(),
        materia: formData.userType === 'docente' ? formData.asignatura : undefined,
        parentesco: formData.userType === 'acudiente' ? 'Acudiente' : undefined,
        expira_min: 1440,
      } as const

      const res = await registrarParticipante(payload)

      const participante = {
        id: res.participante_id,
        nombres: formData.nombres,
        apellidos: '',
        email: formData.email.trim(),
        numeroDocumento: formData.cedula,
        codigoAcceso: formData.codigoEstudiante.toUpperCase(),
      }

      const draftKey = `eva_form_draft_${DEST_FORM_ID}`
      const existing = (() => {
        try { return JSON.parse(localStorage.getItem(draftKey) || '{}') } catch { return {} }
      })()
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          ...(existing || {}),
          participante,
          cedula: formData.cedula,
        })
      )

      toast.success('Registro exitoso. Redirigiendo al formulario…')
      navigate(`/formulario/${DEST_FORM_ID}`, {
        state: { token: res.token, participante },
        replace: true,
      })
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo completar el registro')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRegister()
  }

  return (
    <div
      className={`relative w-full max-w-md transition-all duration-1000 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg border-2 border-transparent">
            <img src="./eva2.png" alt="EVA Sensorial Logo" className="w-full h-full object-contain bg-transparent p-2" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Registro</h1>
          <p className="text-purple-200">Crea tu cuenta en EVA Sensorial</p>
        </div>

        {/* Tipo de usuario */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-purple-100 mb-3">Tipo de Usuario</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleUserTypeChange('docente')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 ${
                formData.userType === 'docente'
                  ? 'border-purple-400 bg-purple-500/20 text-white'
                  : 'border-purple-300/50 bg-white/5 text-purple-200 hover:border-purple-300 hover:bg-white/10'
              }`}
            >
              <GraduationCap className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Docente</span>
            </button>
            <button
              type="button"
              onClick={() => handleUserTypeChange('acudiente')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 ${
                formData.userType === 'acudiente'
                  ? 'border-purple-400 bg-purple-500/20 text-white'
                  : 'border-purple-300/50 bg-white/5 text-purple-200 hover:border-purple-300 hover:bg-white/10'
              }`}
            >
              <Users className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Acudiente</span>
            </button>
          </div>
          {errors.userType && <p className="mt-2 text-sm text-red-300 animate-pulse">{errors.userType}</p>}
        </div>

        {/* Campos condicionados */}
        {formData.userType && (
          <>
            <InputField
              id="cedula"
              type="text"
              label="Cédula"
              value={formData.cedula}
              onChange={(v) => handleInputChange('cedula', v)}
              onKeyPress={handleKeyPress}
              error={errors.cedula}
              placeholder="12345678"
              icon={<IdCard className="h-5 w-5 text-purple-300" />}
            />

            <InputField
              id="nombres"
              type="text"
              label="Nombres Completos"
              value={formData.nombres}
              onChange={(v) => handleInputChange('nombres', v)}
              onKeyPress={handleKeyPress}
              error={errors.nombres}
              placeholder="Juan Carlos Pérez García"
              icon={<User className="h-5 w-5 text-purple-300" />}
            />

            {formData.userType === 'docente' && (
              <InputField
                id="asignatura"
                type="text"
                label="Asignatura"
                value={formData.asignatura}
                onChange={(v) => handleInputChange('asignatura', v)}
                onKeyPress={handleKeyPress}
                error={errors.asignatura}
                placeholder="Matemáticas, Español, Ciencias…"
                icon={<BookOpen className="h-5 w-5 text-purple-300" />}
              />
            )}

            <InputField
              id="codigoEstudiante"
              type="text"
              label={formData.userType === 'docente' ? 'Ingresar Código Estudiante' : 'Código Estudiante'}
              value={formData.codigoEstudiante}
              onChange={(v) => handleInputChange('codigoEstudiante', v.toUpperCase())}
              onKeyPress={handleKeyPress}
              error={errors.codigoEstudiante}
              placeholder="EST2024A"
              icon={<GraduationCap className="h-5 w-5 text-purple-300" />}
            />

            {/* Email obligatorio */}
            <InputField
              id="email"
              type="email"
              label="Correo"
              value={formData.email}
              onChange={(v) => handleInputChange('email', v)}
              onKeyPress={handleKeyPress}
              error={errors.email}
              placeholder="tucorreo@colegio.edu"
              icon={<Mail className="h-5 w-5 text-purple-300" />}
            />

            <div className="mb-6">
              <LoginButton
                onClick={handleRegister}
                isLoading={isLoading}
                text="Crear Cuenta"
                loadingText="Creando cuenta..."
              />
            </div>
          </>
        )}

        <div className="text-center">
          <button
            onClick={onBackToLogin}
            className="inline-flex items-center text-purple-300 hover:text-white font-semibold transition-colors duration-200 hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  )
}

export default RegisterForm
