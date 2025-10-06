// src/Dashboard/components/Configuracion.tsx
import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Configuracion: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="bg-white/20 rounded-2xl p-6 text-white">
      <h2 className="text-xl font-semibold mb-4">Configuración del Sistema</h2>
      <p className="opacity-90 mb-6">Ajustes y preferencias generales.</p>

      <div className="border-t border-white/10 pt-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
};
