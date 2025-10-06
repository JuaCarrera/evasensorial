// src/Dashboard/utils/toFormularioDTO.ts
import type { ApiFormulario, ApiSeccion, ApiModulo, ApiPregunta } from '../services/formularios.service'

export type BuilderSection = { id: string; title: string }
export type BuilderModule  = { id: string; title: string; sectionId: string }
export type BuilderQuestion = { id: string; text: string; moduleId: string; apiId?: number } // 👈 agregado apiId

export function toDTO(params: {
  nombre: string
  descripcion?: string
  categoria?: string
  destinatario: string
  estado: string
  version: number
  sections: BuilderSection[]
  modules: BuilderModule[]
  questions: BuilderQuestion[]
}): ApiFormulario {
  const { nombre, descripcion, categoria, destinatario, estado, version, sections, modules, questions } = params

  const secciones: ApiSeccion[] = sections.map((s, sIdx) => {
    const mods = modules.filter(m => m.sectionId === s.id)
    const modulos: ApiModulo[] = mods.map((m, mIdx) => {
      const qs = questions.filter(q => q.moduleId === m.id)
      return {
        titulo: m.title.trim() || `Módulo ${mIdx + 1}`,
        orden: mIdx + 1,
        preguntas: qs.map((q, qIdx): ApiPregunta => ({
          // No enviamos id (lo crea el backend); si existiera, podrías incluirlo aquí.
          texto: q.text.trim() || `Pregunta ${qIdx + 1}`,
          tipo: 'likert_1_5' as const,
          orden: qIdx + 1,
          opciones: [1, 2, 3, 4, 5],
        })),
      }
    })
    return {
      titulo: s.title.trim() || `Sección ${sIdx + 1}`,
      orden: sIdx + 1,
      modulos,
    }
  })

  return { nombre, descripcion, categoria, destinatario, estado, version, secciones }
}

export function fromAPI(api: ApiFormulario): {
  sections: BuilderSection[]
  modules: BuilderModule[]
  questions: BuilderQuestion[]
} {
  const sections: BuilderSection[] = []
  const modules: BuilderModule[] = []
  const questions: BuilderQuestion[] = []

  ;(api.secciones ?? [])
    .slice().sort((a,b)=>a.orden-b.orden)
    .forEach((sec, si) => {
      const sid = `sec_${si}_${Math.random().toString(36).slice(2,7)}`
      sections.push({ id: sid, title: sec.titulo || `Sección ${si + 1}` })

      ;(sec.modulos ?? [])
        .slice().sort((a,b)=>a.orden-b.orden)
        .forEach((mod, mi) => {
          const mid = `mod_${si}_${mi}_${Math.random().toString(36).slice(2,7)}`
          modules.push({ id: mid, title: mod.titulo || `Módulo ${mi + 1}`, sectionId: sid })

          ;(mod.preguntas ?? [])
            .slice().sort((a,b)=>a.orden-b.orden)
            .forEach((p, qi) => {
              // 👇 Guardamos el id de la pregunta si viene del backend
              const anyP = p as any
              const apiId: number | undefined = anyP?.id ?? anyP?.pregunta_id
              questions.push({
                id: `q_${si}_${mi}_${qi}_${Math.random().toString(36).slice(2,7)}`,
                text: p.texto,
                moduleId: mid,
                apiId,
              })
            })
        })
    })

  if (sections.length === 0) {
    const sid = `sec_init_${Math.random().toString(36).slice(2,7)}`
    sections.push({ id: sid, title: 'Sección 1' })
    const mid = `mod_init_${Math.random().toString(36).slice(2,7)}`
    modules.push({ id: mid, title: 'Módulo 1', sectionId: sid })
    questions.push({
      id: `q_init_${Math.random().toString(36).slice(2,7)}`,
      text: 'Ejemplo: ¿El estudiante se concentró en la sesión?',
      moduleId: mid,
      apiId: undefined,
    })
  }
  return { sections, modules, questions }
}
