/**
 * Auth admin panel — tabbed container for the 6 admin views, plus the
 * existing cuopt configuration page as a sibling tab.
 *
 * Mounted by App.tsx when `mode === 'admin'`. ProtectedRoute already gates
 * access on `requiredRole='admin'`, but as defence-in-depth this component
 * also reads the role from the auth store before rendering the auth tabs.
 */

import {
  FileSearch,
  FolderLock,
  KeyRound,
  Settings as SettingsIcon,
  Shield,
  UsersRound,
} from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { AdminPage } from '@/components/Admin/AdminPage';
import { AuditLog } from '@/components/Admin/auth/AuditLog';
import { CollectionPermissions } from '@/components/Admin/auth/CollectionPermissions';
import { Groups } from '@/components/Admin/auth/Groups';
import { IdentityProviders } from '@/components/Admin/auth/IdentityProviders';
import { RolesPermissions } from '@/components/Admin/auth/RolesPermissions';
import { UserManagement } from '@/components/Admin/auth/UserManagement';
import { useAuthStore } from '@/store/authStore';

interface Tab {
  id: string;
  label: string;
  icon: ReactElement;
  element: ReactElement;
}

const TABS: Tab[] = [
  { id: 'config', label: 'Configuration', icon: <SettingsIcon className="w-4 h-4" />, element: <AdminPage /> },
  { id: 'users', label: 'Users', icon: <Shield className="w-4 h-4" />, element: <UserManagement /> },
  { id: 'roles', label: 'Roles & Permissions', icon: <Shield className="w-4 h-4" />, element: <RolesPermissions /> },
  { id: 'groups', label: 'Groups', icon: <UsersRound className="w-4 h-4" />, element: <Groups /> },
  { id: 'providers', label: 'Identity Providers', icon: <KeyRound className="w-4 h-4" />, element: <IdentityProviders /> },
  { id: 'collections', label: 'Collection Permissions', icon: <FolderLock className="w-4 h-4" />, element: <CollectionPermissions /> },
  { id: 'audit', label: 'Audit Log', icon: <FileSearch className="w-4 h-4" />, element: <AuditLog /> },
];

export function AdminPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [activeId, setActiveId] = useState<string>('config');

  // Auth-related tabs require admin. Configuration tab is always visible.
  const visibleTabs = TABS.filter((t) => t.id === 'config' || role === 'admin');
  const active = visibleTabs.find((t) => t.id === activeId) ?? visibleTabs[0];

  return (
    <div className="h-full overflow-hidden flex flex-col bg-dark-bg">
      <div
        role="tablist"
        aria-label="Admin sections"
        className="flex gap-1 px-6 pt-4 border-b border-dark-border overflow-x-auto"
      >
        {visibleTabs.map((tab) => {
          const isActive = active?.id === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`admin-panel-${tab.id}`}
              onClick={() => setActiveId(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-sm rounded-t-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-dark-card text-white border border-dark-border border-b-transparent'
                  : 'text-gray-400 hover:text-white hover:bg-dark-hover'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`admin-panel-${active?.id ?? 'none'}`}
        className="flex-1 overflow-auto"
      >
        {active ? (
          active.id === 'config' ? (
            active.element
          ) : (
            <div className="max-w-4xl mx-auto p-6">{active.element}</div>
          )
        ) : null}
      </div>
    </div>
  );
}

export default AdminPanel;
