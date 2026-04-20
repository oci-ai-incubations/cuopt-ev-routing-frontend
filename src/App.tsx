import { useState, useEffect } from 'react';

import { AdminPage } from '@/components/Admin';
import { LoginScreen } from '@/components/Auth';
import { ChatInterface } from '@/components/Chat';
import { Dashboard } from '@/components/Dashboard';
import { AppHeader } from '@/components/Layout/AppHeader';
import { AppSidebar } from '@/components/Layout/AppSidebar';
import { HelpModal } from '@/components/Layout/HelpModal';
import { LogoutConfirmModal } from '@/components/Layout/LogoutConfirmModal';
import { SettingsModal } from '@/components/Layout/SettingsModal';
import { Toast } from '@/components/shared/Toast';
import { useAppStore, useConfigStore } from '@/store';

const AUTH_KEY = 'cuopt_auth';

type AppMode = 'dashboard' | 'chat' | 'admin';

export default function App() {
  const [mode, setMode] = useState<AppMode>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const { toasts, removeToast, mapTheme, toggleMapTheme, fetchRuntimeConfig } = useAppStore();
  const { config } = useConfigStore();

  useEffect(() => {
    fetchRuntimeConfig();
  }, [fetchRuntimeConfig]);

  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_KEY);
    if (!savedAuth) return;
    try {
      const authData = JSON.parse(savedAuth);
      if (authData.username && authData.timestamp) {
        const sessionAge = Date.now() - authData.timestamp;
        if (sessionAge < 24 * 60 * 60 * 1000) {
          setIsAuthenticated(true);
          setCurrentUser(authData.username);
        } else {
          localStorage.removeItem(AUTH_KEY);
        }
      }
    } catch {
      localStorage.removeItem(AUTH_KEY);
    }
  }, []);

  const handleLogin = (username: string) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ username, timestamp: Date.now() }));
    setIsAuthenticated(true);
    setCurrentUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.clear();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowLogoutConfirm(false);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-dark-bg text-white overflow-hidden" style={{ minHeight: '100vh' }}>
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
          {mode === 'admin' && <AdminPage />}
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
        currentUser={currentUser}
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
