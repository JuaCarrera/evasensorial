// src/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BackgroundLayout from './Auth/components/BackgroundLayout';
import LoginForm from './Auth/components/LoginForm';
import RegisterForm from './Auth/components/RegisterForm';
import PrivateRoute from './Auth/components/PrivateRoute';
import AppShell from './Dashboard/components/AppShell';
import AppShellLite from './Dashboard/components/AppShellLite'; // 👈 corregido
import { Dashboard } from './Dashboard/components/Dashboard';
import { Terapeutas } from './Dashboard/components/Terapeutas';
import { Estudiantes } from './Dashboard/components/Estudiantes/Estudiantes';
import { Configuracion } from './Dashboard/components/Configuracion';
import { Formularios } from './Dashboard/components/Formularios';
import { Respuestas } from './Dashboard/components/Respuestas';
import { EstudiantesLite } from './Dashboard/components/EstudiantesLite'; // 👈 nuevo import
import FormularioPublicView from './public/FormularioPublicView';

import { ToastContainer } from 'react-toastify';
import { RespuestasLite } from './Dashboard/components/RespuestasLite';

function App() {
  const [currentView, setCurrentView] = React.useState<'login' | 'register'>('login');

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <BackgroundLayout>
              {currentView === 'login' ? (
                <LoginForm onGoToRegister={() => setCurrentView('register')} />
              ) : (
                <RegisterForm onBackToLogin={() => setCurrentView('login')} />
              )}
            </BackgroundLayout>
          }
        />
        <Route path="/formulario/:id" element={<FormularioPublicView />} />

        {/* Dashboard Superadmin */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="terapeutas" element={<Terapeutas />} />
          <Route path="estudiantes" element={<Estudiantes />} />
          <Route path="formularios" element={<Formularios />} />
          <Route path="respuestas" element={<Respuestas />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>

        {/* Dashboard Lite (usuarios normales) */}
        <Route
          path="/lite-dashboard"
          element={
            <PrivateRoute>
              <AppShellLite />
            </PrivateRoute>
          }
        >
          <Route index element={<EstudiantesLite />} />
          <Route path="estudiantes" element={<EstudiantesLite />} />
          <Route path="respuestaslite" element={<RespuestasLite />} />
          <Route path="configuracion" element={<Configuracion />} /> {/* 👈 agregado */}
        </Route>
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        newestOnTop
        theme="dark"
        toastStyle={{
          backgroundColor: '#3A0D5D',
          color: '#FFFFFF',
          border: '1px solid #BB86FC',
          fontWeight: '500',
        }}
        progressStyle={{
          background: '#BB86FC',
        }}
      />
    </>
  );
}

export default App;
