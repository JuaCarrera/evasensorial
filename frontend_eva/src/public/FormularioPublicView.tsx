// src/Public/FormularioPublicWizard.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, ChevronDown, Mail, Badge, KeyRound, Search, Undo2, X } from 'lucide-react'
import { toast } from 'react-toastify'

import { getFormulario } from '../Dashboard/services/formularios.service'
import { fromAPI, BuilderSection, BuilderModule, BuilderQuestion } from '../Dashboard/utils/toFormularioDTO'
import { findEstudianteByDocumento } from '../Dashboard/services/estudiantes.service'

import {
  getTokenPorCedula,
  getEstadoPorToken,
  guardarRespuestasTemporales,
  finalizarToken,
  readLocalToken,
  saveLocalToken,
  clearLocalToken,
} from '../Auth/services/registro.service'

type Answers = Record<string, number | undefined>
type Participante = {
  id: number
  nombres: string
  apellidos: string
  email?: string
  numeroDocumento: string
  codigoAcceso?: string
}

const LS_KEY = (id?: string) => `eva_form_draft_${id ?? 'unknown'}`

const FormularioPublicWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState<string>('Formulario')
  const [description, setDescription] = useState<string>('')

  const [sections, setSections] = useState<BuilderSection[]>([])
  const [modules, setModules] = useState<BuilderModule[]>([])
  const [questions, setQuestions] = useState<BuilderQuestion[]>([])

  const [answers, setAnswers] = useState<Answers>({})
  const [currentSection, setCurrentSection] = useState(0)
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({})
  const lastHoverQuestionId = useRef<string | null>(null)

  const [cedulaInput, setCedulaInput] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [participante, setParticipante] = useState<Participante | null>(null)

  // Anti-doble envío
  const [submitting, setSubmitting] = useState(false)
  const submittedRef = useRef(false)

  // Modal de progreso
  const [showProgress, setShowProgress] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressTimerRef = useRef<number | null>(null)

  // === Map: api pregunta_id -> local questionId ===
  const apiToLocalQId = useMemo(() => {
    const map = new Map<number, string>()
    for (const q of questions) {
      if (q.apiId) map.set(q.apiId, q.id)
    }
    return map
  }, [questions])

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

  // 1) Cargar estructura + restaurar draft (localStorage)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await getFormulario(id || '')
        if (!mounted) return
        const mapped = fromAPI(data)
        setSections(mapped.sections)
        setModules(mapped.modules)
        setQuestions(mapped.questions)
        setTitle(data.nombre || 'Formulario')
        setDescription(data.descripcion || '')

        const raw = localStorage.getItem(LS_KEY(id || ''))
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            setAnswers(parsed.answers ?? {})
            setCurrentSection(
              typeof parsed.currentSection === 'number' && parsed.currentSection < mapped.sections.length
                ? parsed.currentSection
                : 0
            )
            setOpenModules(parsed.openModules ?? {})
            if (parsed.participante) {
              setParticipante(parsed.participante)
              setCedulaInput(parsed.participante.numeroDocumento ?? '')
            } else if (parsed.cedula) {
              setCedulaInput(parsed.cedula)
            }
          } catch {}
        }
        setError(null)
      } catch (e: any) {
        setError(e?.message || 'No se pudo cargar el formulario')
        toast.error(e?.message || 'No se pudo cargar el formulario')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [id])

  // 2) Persistir draft local (para UX offline)
  useEffect(() => {
    const payload = { answers, currentSection, openModules, participante, cedula: cedulaInput }
    localStorage.setItem(LS_KEY(id || ''), JSON.stringify(payload))
  }, [answers, currentSection, openModules, participante, cedulaInput, id])

  // 3) Shortcuts: flechas y 1–5
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (/^[1-5]$/.test(e.key)) {
        const qid = lastHoverQuestionId.current
        if (qid) {
          setAnswers(prev => ({ ...prev, [qid]: Number(e.key) }))
          // si hay token, guarda temporal (unitario)
          const token = readLocalToken()
          const apiId = [...apiToLocalQId.entries()].find(([, localId]) => localId === qid)?.[0]
          if (token && apiId) {
            guardarRespuestasTemporales(token, { pregunta_id: apiId, respuesta: String(e.key) }).catch(() => {})
          }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection, apiToLocalQId])

  const totalSections = sections.length
  const section = sections[currentSection]

  const globalPct = useMemo(() => {
    const total = questions.length
    if (!total) return 0
    const answered = Object.values(answers).filter(v => v !== undefined).length
    return Math.round((answered / total) * 100)
  }, [answers, questions.length])

  const sectionAnsweredPct = useMemo(() => {
    if (!section) return 0
    const allQs = (modulesBySection[section.id] ?? []).flatMap(m => questionsByModule[m.id] ?? [])
    if (allQs.length === 0) return 0
    const answered = allQs.reduce((acc, q) => acc + (answers[q.id] ? 1 : 0), 0)
    return Math.round((answered / allQs.length) * 100)
  }, [section, modulesBySection, questionsByModule, answers])

  const handleSelect = async (qid: string, val: number) => {
    setAnswers(prev => ({ ...prev, [qid]: val }))
    // Auto-guardar respuesta temporal si hay token y apiId
    const token = readLocalToken()
    const apiId = [...apiToLocalQId.entries()].find(([, localId]) => localId === qid)?.[0]
    if (token && apiId) {
      try {
        await guardarRespuestasTemporales(token, { pregunta_id: apiId, respuesta: String(val) })
      } catch {
        /* silencioso */
      }
    }
  }

  const goPrev = () => setCurrentSection(s => Math.max(0, s - 1))
  const goNext = () => setCurrentSection(s => Math.min(totalSections - 1, s + 1))
  const toggleModule = (moduleId: string) =>
    setOpenModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }))

  // === Buscar por CÉDULA → token → estado ===
  const buscarParticipante = async () => {
    const ced = cedulaInput.trim()
    if (!ced) {
      toast.info('Ingresa la cédula para buscar.')
      return
    }
    try {
      setBuscando(true)

      // 1) Intentamos token activo SOLO con cédula
      const tokenResp = await getTokenPorCedula({ documento_identificacion: ced })
      const token = tokenResp.token
      saveLocalToken(token)

      // 2) Estado por token: carga participante + respuestas temporales
      const estado = await getEstadoPorToken(token)

      // Si tu backend trae participante/estudiante por token:
      if (estado?.participante || estado?.estudiante) {
        const nombres = estado.estudiante?.nombres || estado.participante?.nombre || ''
        const apellidos = estado.estudiante?.apellidos || ''
        const email = estado.estudiante?.email || estado.participante?.email
        const codigoAcceso = estado.estudiante?.codigo_acceso

        setParticipante({
          id: estado.estudiante?.id || 0,
          nombres,
          apellidos,
          email,
          numeroDocumento: estado.participante?.documento_identificacion || ced,
          codigoAcceso,
        })
      } else {
        const p = await findEstudianteByDocumento(ced)
        setParticipante({
          id: p.id,
          nombres: p.nombres,
          apellidos: p.apellidos,
          email: p.email,
          numeroDocumento: p.numeroDocumento,
          codigoAcceso: p.codigoAcceso,
        })
      }

      // 3) Re-hidratar respuestas temporales si vienen
      if (estado?.respuestas_temporales?.length) {
        setAnswers(prev => {
          const next = { ...prev }
          for (const r of estado.respuestas_temporales!) {
            const localId = apiToLocalQId.get(r.pregunta_id)
            if (localId) {
              const v = Number(r.respuesta)
              if (v >= 1 && v <= 5) next[localId] = v
            }
          }
          return next
        })
      }

      toast.success('Participante y respuestas cargadas')
    } catch (e: any) {
      clearLocalToken()
      setParticipante(null)
      toast.error(e?.message || 'No hay token activo para esa cédula')
    } finally {
      setBuscando(false)
    }
  }

  const limpiarParticipante = () => {
    setParticipante(null)
    setCedulaInput('')
    clearLocalToken()
  }

  // === Utilidades de progreso (modal) ===
  const startProgress = () => {
    setShowProgress(true)
    setProgress(0)
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current)
    // Incremento suave hasta 90% mientras hay red
    const id = window.setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + Math.max(1, Math.round((90 - prev) / 10)) : prev))
    }, 200)
    progressTimerRef.current = id
  }

  const finishProgress = () => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    setProgress(100)
    // dar un pequeño respiro visual
    setTimeout(() => setShowProgress(false), 350)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // guard contra doble submit (clic + enter / doble clic / race conditions)
    if (submitting || submittedRef.current) return

    const token = readLocalToken()
    if (!token) {
      toast.info('No hay token activo. Busca por cédula primero.')
      return
    }

    try {
      setSubmitting(true)
      startProgress()

      // Armar batch (único payload compacto)
      const batch: Array<{ pregunta_id: number; respuesta: string }> = []
      for (const q of questions) {
        if (answers[q.id] !== undefined && q.apiId) {
          batch.push({ pregunta_id: q.apiId, respuesta: String(answers[q.id]) })
        }
      }

      // Enviar TODO antes de finalizar
      if (batch.length) {
        await guardarRespuestasTemporales(token, { respuestas: batch })
      }

      // Log útil para inspección
      // eslint-disable-next-line no-console
      console.log('JSON final enviado al backend:', batch)

      // Finalizar (idempotente del lado del front por guard; idealmente también en backend)
      await finalizarToken(token)

      submittedRef.current = true
      toast.success('Formulario finalizado y respuestas guardadas')
      // Opcional: limpiar draft local
      // localStorage.removeItem(LS_KEY(id || ''))
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo finalizar')
    } finally {
      setSubmitting(false)
      finishProgress()
    }
  }

  // Autointento: si hay token guardado y NO hay participante, cargar estado
  useEffect(() => {
    const token = readLocalToken()
    if (!token) return
    ;(async () => {
      try {
        const estado = await getEstadoPorToken(token)
        if (estado?.participante || estado?.estudiante) {
          const nombres = estado.estudiante?.nombres || estado.participante?.nombre || ''
          const apellidos = estado.estudiante?.apellidos || ''
          const email = estado.estudiante?.email || estado.participante?.email
          const codigoAcceso = estado.estudiante?.codigo_acceso
          const doc = estado.participante?.documento_identificacion || ''

          setParticipante({
            id: estado.estudiante?.id || 0,
            nombres,
            apellidos,
            email,
            numeroDocumento: doc,
            codigoAcceso,
          })
          setCedulaInput(doc)

          if (estado?.respuestas_temporales?.length) {
            setAnswers(prev => {
              const next = { ...prev }
              for (const r of estado.respuestas_temporales!) {
                const localId = apiToLocalQId.get(r.pregunta_id)
                if (localId) {
                  const v = Number(r.respuesta)
                  if (v >= 1 && v <= 5) next[localId] = v
                }
              }
              return next
            })
          }
        }
      } catch {
        clearLocalToken()
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiToLocalQId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#3b0b6d] via-[#5a18a5] to-[#2a0b54]">
        <div className="flex items-center gap-3 text-purple-100 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-xl">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Cargando formulario…</span>
        </div>
      </div>
    )
  }

  if (error || !section) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3b0b6d] via-[#5a18a5] to-[#2a0b54] p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-900/30 border border-red-400/40 text-red-100 rounded-2xl p-4 backdrop-blur-md shadow-2xl">
            {error || 'No hay secciones para mostrar.'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3b0b6d] via-[#5a18a5] to-[#2a0b54]" />
        <div className="absolute -top-24 -left-24 w-[36rem] h-[36rem] rounded-full bg-purple-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[40rem] h-[40rem] rounded-full bg-fuchsia-400/10 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-6">
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-3xl p-6 md:p-7 border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {title}
            </h1>
            {description && <p className="text-purple-100/90 mt-2 leading-relaxed">{description}</p>}

            <div className="mt-5">
              <div className="flex flex-wrap gap-2 items-center justify-between text-xs text-purple-100/90 mb-2">
                <span>Progreso total</span>
                <span>
                  {globalPct}% • Sección {currentSection + 1} de {totalSections}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 transition-all"
                  style={{ width: `${globalPct}%` }}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-purple-100/90 text-xs mb-2">Ir a la sección</label>
              <select
                value={currentSection}
                onChange={e => setCurrentSection(Number(e.target.value))}
                className="w-full md:w-auto px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-purple-100 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              >
                {sections.map((s, i) => (
                  <option key={s.id} value={i} className="bg-purple-900 text-white">
                    {i + 1}. {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <aside className="rounded-3xl p-5 border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Participante</h3>
            </div>

            {!participante ? (
              <>
                <label className="block text-purple-100/90 text-sm mb-2">Cédula</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-200" />
                    <input
                      value={cedulaInput}
                      onChange={e => setCedulaInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && buscarParticipante()}
                      placeholder="Escribe la cédula"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <button
                    onClick={buscarParticipante}
                    disabled={buscando}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border border-white/20 disabled:opacity-50"
                  >
                    {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                  </button>
                </div>
                <p className="text-xs text-purple-200/80 mt-2">Ingresa la cédula para cargar token activo, nombre, correo y código.</p>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-500 flex items-center justify-center text-white font-bold">
                    {(participante.nombres || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold leading-tight">
                      {participante.nombres} {participante.apellidos}
                    </p>
                    <p className="text-purple-200 text-xs">ID #{participante.id}</p>
                  </div>
                </div>

                <div className="text-sm space-y-1 pt-1">
                  <p className="flex items-center gap-2 text-purple-100">
                    <Badge className="w-4 h-4" />
                    <span className="text-white/95">{participante.numeroDocumento}</span>
                  </p>
                  {participante.email && (
                    <p className="flex items-center gap-2 text-purple-100">
                      <Mail className="w-4 h-4" />
                      <span className="text-white/95">{participante.email}</span>
                    </p>
                  )}
                  {participante.codigoAcceso && (
                    <p className="flex items-center gap-2 text-purple-100">
                      <KeyRound className="w-4 h-4" />
                      <span className="text-white/95">{participante.codigoAcceso}</span>
                    </p>
                  )}
                </div>

                <button
                  onClick={limpiarParticipante}
                  className="mt-2 inline-flex items-center gap-2 text-purple-100/90 hover:text-white px-3 py-1.5 rounded-xl bg-white/10 border border-white/20"
                  title="Cambiar participante"
                >
                  <Undo2 className="w-4 h-4" />
                  Cambiar
                </button>
              </div>
            )}
          </aside>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] overflow-hidden">
            <header className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-semibold tracking-wide">
                {currentSection + 1}. {section.title}
              </h2>
              <span className="text-xs text-purple-100/80">{sectionAnsweredPct}% de esta sección</span>
            </header>

            <div className="p-4 md:p-5 space-y-4">
              {(modulesBySection[section.id] ?? []).map((m, mi) => {
                const open = openModules[m.id] ?? true
                return (
                  <div key={m.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleModule(m.id)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/10 transition"
                    >
                      <span className="text-white/95 font-medium">
                        {mi + 1}. {m.title}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-purple-100 transition-transform ${open ? '' : '-rotate-90'}`} />
                    </button>

                    <div
                      className={`grid transition-all duration-300 ${
                        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="p-4 space-y-4">
                          {(questionsByModule[m.id] ?? []).map((q, qi) => {
                            const value = answers[q.id]
                            return (
                              <div
                                key={q.id}
                                className="space-y-2 group"
                                onMouseEnter={() => (lastHoverQuestionId.current = q.id)}
                              >
                                <p className="text-white/95">
                                  {qi + 1}. {q.text}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {[1, 2, 3, 4, 5].map(n => {
                                    const active = value === n
                                    return (
                                      <label
                                        key={n}
                                        className={[
                                          'cursor-pointer select-none inline-flex items-center gap-2 rounded-full px-3 py-1.5 border text-sm transition-all',
                                          active
                                            ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-white/20 shadow-lg shadow-purple-900/30'
                                            : 'bg-white/10 text-purple-100 border-white/15 hover:bg-white/15 hover:border-white/25',
                                        ].join(' ')}
                                      >
                                        <input
                                          type="radio"
                                          name={q.id}
                                          className="accent-purple-500"
                                          checked={active}
                                          onChange={() => handleSelect(q.id, n)}
                                        />
                                        <span>{n}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={currentSection === 0 || submitting}
              onClick={goPrev}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-purple-100 disabled:opacity-40 hover:bg-white/15 transition"
            >
              Anterior
            </button>

            {currentSection < totalSections - 1 ? (
              <button
                type="button"
                disabled={submitting}
                onClick={goNext}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-purple-900/30 border border-white/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || submittedRef.current}
                aria-busy={submitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-purple-900/30 border border-white/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Enviando…' : submittedRef.current ? 'Enviado' : 'Enviar respuestas'}
              </button>
            )}
          </div>
        </form>

        <footer className="text-center text-xs text-purple-100/80 py-6">Vista pública del formulario • ID: {id}</footer>
      </div>

      {/* MODAL DE PROGRESO */}
      {showProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          {/* Card */}
          <div className="relative z-10 w-[90%] max-w-md rounded-2xl border border-white/20 bg-gradient-to-br from-[#3b0b6d] via-[#5a18a5] to-[#2a0b54] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Guardando y finalizando…</h4>
              <button
                type="button"
                className="text-purple-100/80 hover:text-white disabled:opacity-40"
                disabled
                title="Procesando"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-purple-100/85 text-sm mb-4">
              No cierres esta ventana. Estamos sincronizando tus respuestas.
            </p>

            <div className="w-full h-3 rounded-full bg-white/15 overflow-hidden border border-white/20">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-purple-100/80">
              <span>Progreso</span>
              <span>{progress}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormularioPublicWizard
