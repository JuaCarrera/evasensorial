// src/Auth/components/PrivateRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

type Props = { children: React.ReactElement };

const PrivateRoute: React.FC<Props> = ({ children }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return children;
};

export default PrivateRoute;
