// src/Dashboard/components/TopBar.tsx
import React, { useEffect, useState } from 'react';
import { Search, Bell, User as UserIcon, Menu } from 'lucide-react';

type ActiveView = 'dashboard' | 'terapeutas' | 'estudiantes' | 'configuracion';

interface TopBarProps {
  activeView: ActiveView;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const viewTitles = {
  dashboard: 'Dashboard Principal',
  terapeutas: 'Gestión de Terapeutas',
  estudiantes: 'Gestión de Estudiantes',
  configuracion: 'Configuración del Sistema',
};

// --- helpers para leer el usuario del storage ---
function readUserFromStorage() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    // soporta formatos: { ...campos }, { user: {...} }, { data: {...} }
    return obj?.user ?? obj?.data ?? obj ?? null;
  } catch {
    return null;
  }
}
// -------------------------------------------------

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  sidebarCollapsed,
  setSidebarCollapsed,
}) => {
  const [user, setUser] = useState<null | {
    nombre?: string;
    Cargo?: string;
  }>(() => readUserFromStorage());

  // refresca si cambia localStorage (p.ej. después de login o edición)
  useEffect(() => {
    const reload = () => setUser(readUserFromStorage());
    reload();

    // se dispara cuando otro tab cambia el storage
    window.addEventListener('storage', reload);

    // opcional: permite que tu app dispare este evento tras actualizar el usuario
    // window.dispatchEvent(new Event('user-updated'))
    window.addEventListener('user-updated', reload as EventListener);

    return () => {
      window.removeEventListener('storage', reload);
      window.removeEventListener('user-updated', reload as EventListener);
    };
  }, []);

  const nombre = user?.nombre || 'Usuario';
  const cargo = user?.Cargo || 'Cargo no definido';

  return (
    <header className="bg-white/10 backdrop-blur-sm border-b border-purple-700/30 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden p-2 text-purple-200 hover:text-white hover:bg-purple-800/50 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-xl font-semibold text-white">
              {viewTitles[activeView]}
            </h2>
            <p className="text-purple-300 text-sm">
              Bienvenido al sistema de gestión EVA Sensorial
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
      

          {/* User */}
          <button className="flex items-center space-x-2 p-2 text-purple-200 hover:text-white hover:bg-purple-800/50 rounded-lg transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white">{nombre}</p>
              <p className="text-xs text-purple-400">{cargo}</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
