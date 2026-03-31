import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getUserFromToken } from '../utils/jwtHelper';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[]; // Optional: for role-based access
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const user = getUserFromToken();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
