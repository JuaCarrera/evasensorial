// src/hooks/useTerapeutas.ts
import { useEffect, useState } from 'react'
import { terapeutasService, TerapeutaDTO, CreateTerapeutaDTO } from '../services/terapeutas.service'

export function useTerapeutas() {
  const [items, setItems] = useState<TerapeutaDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await terapeutasService.list()
      setItems(data)
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar terapeutas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  // 👉 Sincroniza SIEMPRE con el backend tras cada operación
  const add = async (payload: Omit<CreateTerapeutaDTO, 'terapeuta_id'>) => {
    await terapeutasService.create(payload as CreateTerapeutaDTO)
    await refresh()
  }

  const update = async (id: number, patch: Partial<CreateTerapeutaDTO>) => {
    await terapeutasService.update(id, patch)
    await refresh()
  }

  const remove = async (id: number) => {
    await terapeutasService.remove(id)
    await refresh()
  }

  return { items, loading, error, refresh, add, update, remove }
}
