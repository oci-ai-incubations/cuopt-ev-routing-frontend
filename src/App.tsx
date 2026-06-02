import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import {
  AdminPanel,
  ChatInterface,
  Dashboard,
  AppHeader,
  AppSidebar,
  HelpModal,
  LogoutConfirmModal,
  SettingsModal,
  LoginGuard,
  ProtectedRoute,
  Toast,
} from '@/components';
import { Login, SSOCallback } from '@/pages';
import { useAppStore, useConfigStore, useAuthStore } from '@/store';

type AppMode = 'dashboard' | 'chat' | 'admin';

interface AppShellProps {
  initialMode?: AppMode;
}

function AppShell({ initialMode = 'dashboard' }: AppShellProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AppMode>(initialMode);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { toasts, removeToast, mapTheme, toggleMapTheme, fetchRuntimeConfig } = useAppStore();
  const { config } = useConfigStore();
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    fetchRuntimeConfig();
  }, [fetchRuntimeConfig]);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/login', { replace: true });
  };

  return (
    <div
      className="flex h-screen bg-dark-bg text-white overflow-hidden"
      style={{ minHeight: '100vh' }}
    >
      <AppSidebar
        mode={mode}
        collapsed={sidebarCollapsed}
        onSetMode={setMode}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        onShowHelp={() => setShowHelp(true)}
        onShowSettings={() => setShowSettings(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          mode={mode}
          countryCode={config.countryCode}
          activeScenario={config.activeScenario}
        />
        <div className="flex-1 overflow-hidden">
          {mode === 'dashboard' && <Dashboard />}
          {mode === 'chat' && <ChatInterface />}
          {mode === 'admin' && <AdminPanel />}
        </div>
      </main>

      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        mapTheme={mapTheme}
        onToggleMapTheme={toggleMapTheme}
        onLogoutClick={() => setShowLogoutConfirm(true)}
      />

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

/**
 * Root application component.
 *
 * Routing:
 *   /login                 — public, LoginGuard redirects authenticated users to /
 *   /sso/callback/:slug    — OIDC callback exchange, also LoginGuarded
 *   /                      — ProtectedRoute → AppShell (default mode dashboard)
 *   /admin                 — ProtectedRoute requiredRole="admin" → AppShell pinned to admin mode
 *   *                      — redirect to /
 *
 * On mount, if a persisted token exists, refresh the user from /auth/me to
 * verify the token is still valid (authClient will refresh-or-logout on 401).
 */
export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loadCurrentUser = useAuthStore((s) => s.loadCurrentUser);

  useEffect(() => {
    if (isAuthenticated) {
      void loadCurrentUser();
    }
    // Only run on initial mount + when authentication transitions; further
    // triggers come from the store itself.
  }, [isAuthenticated, loadCurrentUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginGuard>
              <Login />
            </LoginGuard>
          }
        />
        <Route
          path="/sso/callback/:slug"
          element={
            <LoginGuard>
              <SSOCallback />
            </LoginGuard>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AppShell initialMode="admin" />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
