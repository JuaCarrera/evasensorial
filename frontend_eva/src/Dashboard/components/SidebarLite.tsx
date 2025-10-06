// src/Dashboard/components/SidebarLite.tsx
import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Users, FileText, Settings, ChevronLeft, ChevronRight, Brain } from 'lucide-react'

export const SidebarLite: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)

  // 🟣 Auto-colapsar en pantallas pequeñas
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true)
      } else {
        setCollapsed(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div
      className={`
        ${collapsed ? 'w-20' : 'w-64'} 
        bg-purple-900/90 text-white h-screen flex flex-col transition-all duration-300 relative
      `}
    >
      {/* Header */}
      <div className="p-6 border-b border-purple-700/30 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        {!collapsed && <h2 className="text-xl font-bold">Panel Terapeuta</h2>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-2">
        <NavLink
          to="/lite-dashboard/estudiantes"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              isActive ? 'bg-purple-700 text-white shadow' : 'hover:bg-purple-800 text-purple-200'
            }`
          }
        >
          <Users className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Estudiantes</span>}
        </NavLink>

        <NavLink
          to="/lite-dashboard/respuestaslite"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              isActive ? 'bg-purple-700 text-white shadow' : 'hover:bg-purple-800 text-purple-200'
            }`
          }
        >
          <FileText className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Respuestas</span>}
        </NavLink>

        <NavLink
          to="/lite-dashboard/configuracion"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              isActive ? 'bg-purple-700 text-white shadow' : 'hover:bg-purple-800 text-purple-200'
            }`
          }
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Configuración</span>}
        </NavLink>
      </nav>

      {/* Toggle colapsar */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition shadow-lg z-50"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  )
}
