// src/Dashboard/components/AppShellLite.tsx
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SidebarLite } from './SidebarLite';
import { TopBar } from './TopBar';

type ActiveView = 'estudiantes' | 'respuestas';

const AppShellLite: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState<boolean>(false);
  const [activeView, setActiveView] = React.useState<ActiveView>('estudiantes');

  // Sincronizar estado activo con URL
  React.useEffect(() => {
    const path = location.pathname.replace(/^\/+/, '');
    if (path.startsWith('lite-dashboard/respuestas')) setActiveView('respuestas');
    else setActiveView('estudiantes');
  }, [location.pathname]);

  // Navegar desde el sidebar
  const handleSetActiveView = (view: ActiveView) => {
    setActiveView(view);
    navigate(`/lite-dashboard/${view}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="flex h-screen">
        <SidebarLite
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

export default AppShellLite;
