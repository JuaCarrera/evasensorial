// src/Dashboard/hooks/useFormularioBuilder.ts
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { createFormulario, getFormulario, updateFormulario } from '../services/formularios.service'
import { toDTO, fromAPI, BuilderSection, BuilderModule, BuilderQuestion } from '../utils/toFormularioDTO'

function uid(p='id'){ return `${p}_${Math.random().toString(36).slice(2,9)}` }

type PreviewSnapshot = {
  meta: {
    nombre: string
    descripcion?: string
  }
  sections: BuilderSection[]
  modules: BuilderModule[]
  questions: BuilderQuestion[]
}

const DEFAULT_LOAD_ID = 8

export function useFormularioBuilder(formularioId?: string | null) {
  const [meta, setMeta] = useState({
    nombre: 'Nuevo Formulario',
    descripcion: '',
    categoria: 'Diagnóstico',
    destinatario: 'Estudiantes',
    estado: 'Borrador',
    version: 1,
  })

  const [sections, setSections] = useState<BuilderSection[]>([{ id: uid('sec'), title: 'Sección 1' }])
  const [modules, setModules]   = useState<BuilderModule[]>([{ id: uid('mod'), title: 'Módulo 1', sectionId: '' }])
  const [questions, setQuestions] = useState<BuilderQuestion[]>([{ id: uid('q'), text: 'Ejemplo: …', moduleId: '' }])

  // inicializar referencias válidas
  useEffect(() => {
    setModules(prev => prev.map((m, i) => i===0 ? { ...m, sectionId: sections[0].id } : m))
    setQuestions(prev => prev.map((q, i) => i===0 ? { ...q, moduleId: modules[0]?.id ?? uid('mod-fake') } : q))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [editing, setEditing] = useState<{ id: string | null; text: string }>({ id: null, text: '' })
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(null)

  // Preview controlado por snapshot (puede ser del builder o de un GET por id)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSnapshot, setPreviewSnapshot] = useState<PreviewSnapshot | null>(null)

  // -------- CARGA POR ID (URL) ----------
  useEffect(() => {
    if (!formularioId) return
    ;(async () => {
      try {
        const data = await getFormulario(formularioId)
        const mapped = fromAPI(data)
        setSections(mapped.sections)
        setModules(mapped.modules)
        setQuestions(mapped.questions)
        setMeta(prev => ({
          nombre: data.nombre ?? prev.nombre,
          descripcion: data.descripcion ?? '',
          categoria: data.categoria ?? '',
          destinatario: data.destinatario ?? 'Estudiantes',
          estado: data.estado ?? 'Borrador',
          version: data.version ?? 1,
        }))
        setSavedId(data.formulario_id ?? Number(formularioId))
        toast.success('Formulario cargado')
      } catch (e:any) {
        toast.error(e?.message || 'No se pudo cargar el formulario')
      }
    })()
  }, [formularioId])

  // -------- CARGA POR DEFECTO ID=6 (si no viene id y no hay algo guardado) ----------
  useEffect(() => {
    if (formularioId || savedId) return
    ;(async () => {
      try {
        const data = await getFormulario(DEFAULT_LOAD_ID)
        const mapped = fromAPI(data)
        setSections(mapped.sections)
        setModules(mapped.modules)
        setQuestions(mapped.questions)
        setMeta(prev => ({
          nombre: data.nombre ?? prev.nombre,
          descripcion: data.descripcion ?? '',
          categoria: data.categoria ?? '',
          destinatario: data.destinatario ?? 'Estudiantes',
          estado: data.estado ?? 'Borrador',
          version: data.version ?? 1,
        }))
        setSavedId(data.formulario_id ?? DEFAULT_LOAD_ID)
        toast.info(`Cargado formulario por defecto #${DEFAULT_LOAD_ID}`)
      } catch {
        // si no existe, nos quedamos con la plantilla vacía sin molestar
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formularioId])

  const modulesBySection = useMemo(() => {
    const m: Record<string, BuilderModule[]> = {}
    for (const s of sections) m[s.id] = []
    for (const md of modules) if (m[md.sectionId]) m[md.sectionId].push(md)
    return m
  }, [sections, modules])

  const questionsByModule = useMemo(() => {
    const q: Record<string, BuilderQuestion[]> = {}
    for (const md of modules) q[md.id] = []
    for (const it of questions) if (q[it.moduleId]) q[it.moduleId].push(it)
    return q
  }, [modules, questions])

  /* Secciones */
  const addSection = useCallback(() => {
    const id = uid('sec')
    setSections(prev => [...prev, { id, title: `Sección ${prev.length + 1}` }])
  }, [])

  const renameSection = useCallback((id: string, title: string) => {
    setSections(prev => prev.map(s => s.id===id ? { ...s, title } : s))
  }, [])

  const deleteSection = useCallback((id: string) => {
    const modsToDelete = modules.filter(m => m.sectionId === id).map(m => m.id)
    setSections(prev => prev.filter(s => s.id !== id))
    setModules(prev => prev.filter(m => m.sectionId !== id))
    setQuestions(prev => prev.filter(q => !modsToDelete.includes(q.moduleId)))
  }, [modules])

  /* Módulos */
  const addModule = useCallback((sectionId: string) => {
    setModules(prev => [...prev, { id: uid('mod'), title: 'Nuevo módulo', sectionId }])
  }, [])

  const renameModule = useCallback((id: string, title: string) => {
    setModules(prev => prev.map(m => m.id===id ? { ...m, title } : m))
  }, [])

  const deleteModule = useCallback((id: string) => {
    setModules(prev => prev.filter(m => m.id !== id))
    setQuestions(prev => prev.filter(q => q.moduleId !== id))
  }, [])

  /* Preguntas */
  const addQuestion = useCallback((moduleId: string) => {
    setQuestions(prev => [...prev, { id: uid('q'), text: 'Nueva pregunta (1-5)', moduleId }])
  }, [])

  const duplicateQuestion = useCallback((q: BuilderQuestion) => {
    setQuestions(prev => [...prev, { id: uid('q'), text: q.text, moduleId: q.moduleId }])
  }, [])

  const deleteQuestion = useCallback((id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id))
  }, [])

  const beginEdit = useCallback((q: BuilderQuestion) => setEditing({ id: q.id, text: q.text }), [])
  const commitEdit = useCallback(() => {
    if (!editing.id) return
    setQuestions(prev => prev.map(q => q.id===editing.id ? { ...q, text: editing.text } : q))
    setEditing({ id: null, text: '' })
  }, [editing])
  const cancelEdit = useCallback(() => setEditing({ id: null, text: '' }), [])

  /* Drag & Drop: mover pregunta entre módulos */
  const onDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, questionId: string) => {
    e.dataTransfer.setData('text/question-id', questionId)
    e.dataTransfer.effectAllowed = 'move'
  }, [])
  const onDragOverModule = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])
  const onDropToModule = useCallback((e: React.DragEvent<HTMLDivElement>, targetModuleId: string) => {
    e.preventDefault()
    const qid = e.dataTransfer.getData('text/question-id')
    if (!qid) return
    setQuestions(prev => prev.map(q => q.id===qid ? { ...q, moduleId: targetModuleId } : q))
  }, [])

  /* Reordenar dentro de un módulo */
  const moveQuestion = useCallback((moduleId: string, qid: string, dir: 'up'|'down') => {
    const list = questions.filter(q => q.moduleId === moduleId)
    const idx = list.findIndex(q => q.id === qid)
    if (idx < 0) return
    const target = dir === 'up' ? idx-1 : idx+1
    if (target < 0 || target >= list.length) return
    const a = list[idx], b = list[target]
    const all = [...questions]
    const ai = all.findIndex(q => q.id===a.id)
    const bi = all.findIndex(q => q.id===b.id)
    ;[all[ai], all[bi]] = [all[bi], all[ai]]
    setQuestions(all)
  }, [questions])

  /* Guardar / Actualizar según API */
  const saveOrUpdate = useCallback(async () => {
    try {
      setSaving(true)
      // Si hay id (query) o ya guardamos antes, PUT de top-level (tu API así lo define)
      const currentId = formularioId || savedId
      if (currentId) {
        await updateFormulario(currentId, {
          nombre: meta.nombre,
          descripcion: meta.descripcion,
          categoria: meta.categoria,
          destinatario: meta.destinatario,
          estado: meta.estado,
          version: meta.version,
        })
        toast.success('Formulario actualizado (campos principales)')
        return Number(currentId)
      }
      // Si no hay id, POST con toda la estructura
      const dto = toDTO({ ...meta, sections, modules, questions })
      const created = await createFormulario(dto)
      setSavedId(created.formulario_id)
      toast.success('Formulario creado')
      return created.formulario_id
    } catch (e:any) {
      toast.error(e?.message || 'No se pudo guardar')
      return null
    } finally {
      setSaving(false)
    }
  }, [meta, sections, modules, questions, formularioId, savedId])

  /* --- PREVIEW helpers --- */

  // Visualizar el snapshot actual del builder (sin tocar nada)
  const openPreviewCurrent = useCallback(() => {
    const snap: PreviewSnapshot = {
      meta: { nombre: meta.nombre, descripcion: meta.descripcion },
      sections: [...sections],
      modules: [...modules],
      questions: [...questions],
    }
    setPreviewSnapshot(snap)
    setPreviewOpen(true)
  }, [meta, sections, modules, questions])

  // Visualizar por ID: carga desde API y usa snapshot para el modal (no pisa el estado del editor)
  const openPreviewById = useCallback(async (id: number | string) => {
    try {
      const data = await getFormulario(id)
      const mapped = fromAPI(data)
      const snap: PreviewSnapshot = {
        meta: { nombre: data.nombre, descripcion: data.descripcion },
        sections: mapped.sections,
        modules: mapped.modules,
        questions: mapped.questions,
      }
      setPreviewSnapshot(snap)
      setPreviewOpen(true)
    } catch (e:any) {
      toast.error(e?.message || 'No se pudo previsualizar por ID')
    }
  }, [])

  return {
    // estado base
    meta, setMeta,
    sections, setSections,
    modules, setModules,
    questions, setQuestions,
    modulesBySection, questionsByModule,

    // acciones de edición
    addSection, renameSection, deleteSection,
    addModule, renameModule, deleteModule,
    addQuestion, duplicateQuestion, deleteQuestion,
    beginEdit, commitEdit, cancelEdit, editing, setEditing,
    onDragStart, onDragOverModule, onDropToModule, moveQuestion,

    // persistencia
    saveOrUpdate, saving, savedId,

    // preview
    previewOpen, setPreviewOpen,
    previewSnapshot, openPreviewCurrent, openPreviewById,
  }
}
