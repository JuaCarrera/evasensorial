import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Settings, 
  Brain,
  ChevronLeft,
  ChevronRight,
  FileText,
  ListChecks // ✅ nuevo icono sugerido para "Respuestas"
} from 'lucide-react';

type ActiveView = 'dashboard' | 'terapeutas' | 'estudiantes' | 'formularios' | 'respuestas' | 'configuracion';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'terapeutas', label: 'Terapeutas', icon: Users },
  { id: 'estudiantes', label: 'Estudiantes', icon: GraduationCap },
  { id: 'formularios', label: 'Formularios', icon: FileText },
  { id: 'respuestas', label: 'Respuestas', icon: ListChecks }, // ✅ añadido
  { id: 'configuracion', label: 'Configuración', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView, 
  collapsed, 
  setCollapsed 
}) => {
  return (
    <div className={`
      ${collapsed ? 'w-20' : 'w-64'} 
      bg-purple-900/50 backdrop-blur-sm border-r border-purple-700/30 
      transition-all duration-300 flex flex-col relative
    `}>
      {/* Header */}
      <div className="p-6 border-b border-purple-700/30">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-white font-bold text-lg">EVA Sensorial</h1>
              <p className="text-purple-300 text-sm">Dashboard</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveView(item.id as ActiveView)}
                className={`
                  w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200
                  ${activeView === item.id 
                    ? 'bg-purple-600/80 text-white shadow-lg' 
                    : 'text-purple-200 hover:bg-purple-800/50 hover:text-white'
                  }
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="ml-3 font-medium">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-lg"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </div>
  );
};
