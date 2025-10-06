// src/Dashboard/hooks/useEstudiantes.ts
import { useEffect, useState } from 'react'
import {
  estudiantesService,
  EstudianteUI,
  CreateEstudianteUI,
  asignarTerapeuta,   // 👈 importar del service
} from '../services/estudiantes.service'

export function useEstudiantes() {
  const [items, setItems] = useState<EstudianteUI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await estudiantesService.list()
      setItems(data)
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar estudiantes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const add = async (payload: CreateEstudianteUI) => {
    const created = await estudiantesService.create(payload)
    await refresh()
    return created
  }

  const update = async (id: number, patch: Partial<CreateEstudianteUI>) => {
    const updated = await estudiantesService.update(id, patch)
    await refresh()
    return updated
  }

  const remove = async (id: number) => {
    await estudiantesService.remove(id)
    await refresh()
  }

  const resendCode = (id: number, destinatarios: string[], regenerate = false) =>
    estudiantesService.resendCode(id, destinatarios, regenerate)

  /** 👉 nuevo método: asignar terapeuta a estudiante */
  const assignTerapeuta = async (estudianteId: number, terapeutaId: number) => {
    await asignarTerapeuta(estudianteId, terapeutaId)
    await refresh() // 👈 refresca lista después de asignar
  }

  return { items, loading, error, refresh, add, update, remove, resendCode, assignTerapeuta }
}
