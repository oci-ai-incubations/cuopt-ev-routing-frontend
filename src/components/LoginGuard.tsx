import { Navigate } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';

import type { ReactNode } from 'react';

interface LoginGuardProps {
  children: ReactNode;
}

/**
 * Wraps the /login route so that an already-authenticated user is bounced
 * back to the app root rather than seeing the form again.
 */
export function LoginGuard({ children }: LoginGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}
