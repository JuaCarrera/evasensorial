// src/hooks/useEstudiantesPorTerapeuta.ts
import { useEffect, useState } from 'react'
import { API_URL } from '../../config/api'

export interface EstudianteAsignadoUI {
  id: number
  nombres: string
  apellidos: string
  email: string
  codigoAcceso: string
  documentoIdentificacion: string
  fechaNacimiento: string
  edad: number | null
  grado: string
  colegio: string
}

export function useEstudiantesPorTerapeuta() {
  const [items, setItems] = useState<EstudianteAsignadoUI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (!user?.terapeuta_id) {
          throw new Error('No se encontró terapeuta_id en el usuario logueado')
        }

        const token = localStorage.getItem('token')
        const res = await fetch(`${API_URL}/estudiantes/por-terapeuta/${user.terapeuta_id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        })

        if (!res.ok) throw new Error('Error cargando estudiantes asignados')

        const data = await res.json()

        const normalizados: EstudianteAsignadoUI[] = data.map((e: any) => ({
          id: e.estudiante_id,
          nombres: e.nombre ?? '',
          apellidos: e.apellidos ?? '',
          email: e.email ?? '—',
          codigoAcceso: e.codigo_acceso ?? '—',
          documentoIdentificacion: e.documento_identificacion ?? '—',
          fechaNacimiento: e.fecha_nacimiento ?? '',
          edad: e.edad ?? null,
          grado: e.grado ?? '—',
          colegio: e.colegio ?? '—',
        }))

        setItems(normalizados)
      } catch (err: any) {
        setError(err.message || 'Error en la carga')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { items, loading, error }
}
