export const calculateAge = (birthDate?: string) => {
  if (!birthDate) return undefined
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export const getStatusColor = (status?: string) => {
  switch (status) {
    case 'Activo': return 'bg-green-500/20 text-green-400'
    case 'Pausa': return 'bg-yellow-500/20 text-yellow-400'
    case 'Completado': return 'bg-blue-500/20 text-blue-400'
    default: return 'bg-gray-500/20 text-gray-400'
  }
}

export const getProgressColor = (progress = 0) => {
  if (progress >= 80) return 'from-green-400 to-green-600'
  if (progress >= 60) return 'from-yellow-400 to-yellow-600'
  return 'from-red-400 to-red-600'
}

export const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString() : '—'
