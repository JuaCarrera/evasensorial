// src/Dashboard/components/AppShell.tsx
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

type ActiveView = 'dashboard' | 'terapeutas' | 'estudiantes' | 'respuestas' | 'configuracion';

const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState<boolean>(false);
  const [activeView, setActiveView] = React.useState<ActiveView>('dashboard');

  // Sincroniza el estado activo con la URL
  React.useEffect(() => {
    const path = location.pathname.replace(/^\/+/, '');
    if (path.startsWith('dashboard/terapeutas')) setActiveView('terapeutas');
    else if (path.startsWith('dashboard/estudiantes')) setActiveView('estudiantes');
    else if (path.startsWith('dashboard/respuestas')) setActiveView('respuestas');
    else if (path.startsWith('dashboard/configuracion')) setActiveView('configuracion');
    else setActiveView('dashboard');
  }, [location.pathname]);

  // Al cambiar desde el Sidebar, navega a la ruta correspondiente
  const handleSetActiveView = (view: ActiveView) => {
    setActiveView(view);
    navigate(
      view === 'dashboard' ? '/dashboard' : `/dashboard/${view}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="flex h-screen">
        <Sidebar
          activeView={activeView}
          setActiveView={handleSetActiveView}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar
            activeView={activeView}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-purple-50/10 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
