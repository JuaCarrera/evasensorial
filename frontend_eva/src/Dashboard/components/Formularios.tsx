// src/Dashboard/components/Formularios.tsx
import React from 'react'
import {
  Plus, Save, Trash2, GripVertical, FolderPlus, Edit, Copy,
  ChevronUp, ChevronDown, Eye, X, Folder
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useFormularioBuilder } from '../hooks/useFormularioBuilder'

export const Formularios: React.FC = () => {
  const [search] = useSearchParams()
  const id = search.get('id') // seguimos usando ?id=

  const {
    meta, setMeta,
    sections,
    modules,
    modulesBySection, questionsByModule,
    addSection, renameSection, deleteSection,
    addModule, renameModule, deleteModule,
    addQuestion, duplicateQuestion, deleteQuestion,
    beginEdit, commitEdit, cancelEdit, editing, setEditing,
    onDragStart, onDragOverModule, onDropToModule, moveQuestion,
    saveOrUpdate, saving, savedId,
    previewOpen, setPreviewOpen,
  } = useFormularioBuilder(id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white">Constructor de Formulario</h2>
          <p className="text-purple-300">Secciones → Módulos → Preguntas (Likert 1–5) con drag & drop</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addSection}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            Nueva Sección
          </button>
          <button
            onClick={async () => { const fid = await saveOrUpdate(); if (fid) setPreviewOpen(true) }}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-purple-500/70 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            title="Guardar y previsualizar"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
            title="Visualizar (solo lectura)"
          >
            <Eye className="w-4 h-4" />
            Visualizar
          </button>
        </div>
      </div>

      {/* Metadatos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          className="bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={meta.nombre}
          onChange={(e) => setMeta({ ...meta, nombre: e.target.value })}
          placeholder="Nombre del formulario"
        />
        <input
          className="bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={meta.categoria}
          onChange={(e) => setMeta({ ...meta, categoria: e.target.value })}
          placeholder="Categoría"
        />
        <select
          className="bg-purple-800/30 border border-purple-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={meta.destinatario}
          onChange={(e) => setMeta({ ...meta, destinatario: e.target.value })}
        >
          <option>Estudiantes</option>
          <option>Docentes</option>
          <option>Acudientes</option>
          <option>Terapeutas</option>
        </select>
      </div>

      {/* Canvas: Secciones */}
      <div className="space-y-6">
        {sections.map((sec) => (
          <div key={sec.id} className="bg-white/10 backdrop-blur-sm rounded-xl border border-purple-700/30">
            {/* Section header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-700/30">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-purple-300" />
                <input
                  value={sec.title}
                  onChange={(e) => renameSection(sec.id, e.target.value)}
                  className="bg-transparent text-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 rounded px-2 py-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => addModule(sec.id)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/70 hover:bg-purple-600 text-white rounded-lg"
                >
                  <Plus className="w-4 h-4" /> Módulo
                </button>
                <button
                  onClick={() => deleteSection(sec.id)}
                  className="px-3 py-1.5 bg-red-600/70 hover:bg-red-600 text-white rounded-lg"
                  title="Eliminar sección"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modules inside section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
              {(modulesBySection[sec.id] ?? []).map((mod) => (
                <div key={mod.id} className="bg-purple-900/40 border border-purple-700/40 rounded-lg">
                  {/* Module header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-purple-700/40">
                    <input
                      value={mod.title}
                      onChange={(e) => renameModule(mod.id, e.target.value)}
                      className="bg-transparent text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 rounded px-2 py-1"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addQuestion(mod.id)}
                        className="px-3 py-1.5 bg-purple-600/70 hover:bg-purple-600 rounded text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteModule(mod.id)}
                        className="px-3 py-1.5 bg-red-600/70 hover:bg-red-600 rounded text-white"
                        title="Eliminar módulo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Drop zone for questions */}
                  <div
                    className="p-3 min-h-[100px] rounded-b-lg"
                    onDragOver={(e)=>{ e.currentTarget.classList.add('ring-2','ring-purple-500'); onDragOverModule(e)}}
                    onDragLeave={(e)=> e.currentTarget.classList.remove('ring-2','ring-purple-500')}
                    onDrop={(e)=>{ e.currentTarget.classList.remove('ring-2','ring-purple-500'); onDropToModule(e, mod.id)}}
                  >
                    {(questionsByModule[mod.id] ?? []).length ? (
                      <ul className="space-y-2">
                        {(questionsByModule[mod.id] ?? []).map((q) => (
                          <li
                            key={q.id}
                            className="bg-white/5 border border-purple-700/40 rounded p-3 group"
                            draggable
                            onDragStart={(e)=> onDragStart(e, q.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1 opacity-80 group-hover:opacity-100">
                                <GripVertical className="w-4 h-4 text-purple-300" />
                              </div>
                              <div className="flex-1">
                                {editing.id === q.id ? (
                                  <div className="space-y-2">
                                    <input
                                      autoFocus
                                      value={editing.text}
                                      onChange={(e)=> setEditing({ id: q.id, text: e.target.value })}
                                      className="w-full bg-purple-800/30 border border-purple-700/50 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <div className="flex gap-2">
                                      <button onClick={commitEdit} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-white">
                                        Guardar
                                      </button>
                                      <button onClick={cancelEdit} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-white">
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-white">{q.text}</p>
                                    <div className="mt-2 flex gap-2">
                                      {[1,2,3,4,5].map(n=>(
                                        <button key={n} className="px-2 py-1 rounded bg-purple-800/40 border border-purple-700/50 text-purple-100 text-sm" onClick={(e)=>e.preventDefault()}>{n}</button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                <button onClick={()=> moveQuestion(mod.id, q.id, 'up')} className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white" title="Subir">
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button onClick={()=> moveQuestion(mod.id, q.id, 'down')} className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white" title="Bajar">
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="flex flex-col gap-2">
                                <button onClick={()=> beginEdit(q)} className="p-1.5 rounded bg-purple-600/70 hover:bg-purple-600 text-white" title="Editar">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={()=> duplicateQuestion(q)} className="p-1.5 rounded bg-purple-500/70 hover:bg-purple-500 text-white" title="Duplicar">
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button onClick={()=> deleteQuestion(q.id)} className="p-1.5 rounded bg-red-600/70 hover:bg-red-600 text-white" title="Eliminar">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-purple-300 text-sm bg-white/5 rounded-lg p-4 border border-dashed border-purple-700/40">
                        Arrastra preguntas aquí o usa <span className="text-white font-medium">“+”</span> para crear una nueva.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-purple-900/90 border border-purple-700/40 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-purple-700/40">
              <div>
                <h3 className="text-white font-semibold">{meta.nombre}</h3>
                <p className="text-purple-300 text-sm">{meta.descripcion || 'Previsualización'}</p>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="text-purple-200 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {sections.map((s, si) => (
                <div key={s.id} className="bg-white/10 rounded-lg border border-purple-700/30">
                  <div className="px-4 py-3 border-b border-purple-700/30">
                    <h4 className="text-white font-semibold">{si + 1}. {s.title}</h4>
                  </div>

                  <div className="p-4 space-y-5">
                    {(modulesBySection[s.id] ?? []).map((m, mi) => (
                      <div key={m.id} className="bg-white/5 rounded border border-purple-700/30">
                        <div className="px-3 py-2 border-b border-purple-700/30">
                          <h5 className="text-white font-medium">{si + 1}.{mi + 1} {m.title}</h5>
                        </div>
                        <div className="p-3 space-y-4">
                          {(questionsByModule[m.id] ?? []).map((q, qi) => (
                            <div key={q.id}>
                              <p className="text-white mb-2">{si + 1}.{mi + 1}.{qi + 1} {q.text}</p>
                              <div className="flex gap-2">
                                {[1,2,3,4,5].map(n => (
                                  <label key={n} className="flex items-center gap-1 text-purple-200">
                                    <input type="radio" name={`${q.id}-likert`} disabled className="accent-purple-500" />
                                    <span className="text-sm">{n}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {savedId && <p className="text-xs text-purple-300">ID guardado: {savedId}</p>}

              <div className="flex justify-end">
                <button onClick={() => setPreviewOpen(false)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Formularios
