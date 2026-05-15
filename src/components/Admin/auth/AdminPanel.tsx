// Tab visibility is driven by GET /auth/pack/model: each auth tab is gated
// on a permission key, and only shows when the active pack model lists it.
// Same FE binary serves every pack with a pack-specific admin surface.
// Configuration is always visible (not auth-gated). The user-role check is
// defence-in-depth on top of ProtectedRoute(requiredRole='admin').

import {
  FileSearch,
  FolderLock,
  KeyRound,
  Settings as SettingsIcon,
  Shield,
  ToggleLeft,
  UsersRound,
} from 'lucide-react';
import { type ReactElement, useEffect, useState } from 'react';

import { fetchPackModel } from '@/api/admin';
import { AdminPage } from '@/components/Admin/AdminPage';
import { ApiKeysPanel } from '@/components/Admin/auth/ApiKeysPanel';
import { AuditLog } from '@/components/Admin/auth/AuditLog';
import { CollectionPermissions } from '@/components/Admin/auth/CollectionPermissions';
import { FeatureFlagsPanel } from '@/components/Admin/auth/FeatureFlagsPanel';
import { Groups } from '@/components/Admin/auth/Groups';
import { IdentityProviders } from '@/components/Admin/auth/IdentityProviders';
import { PanelLoading } from '@/components/Admin/auth/_primitives';
import { RolesPermissions } from '@/components/Admin/auth/RolesPermissions';
import { UserManagement } from '@/components/Admin/auth/UserManagement';
import { useAuthStore } from '@/store/authStore';
import type { PackAuthModel } from '@/types/admin';

interface Tab {
  id: string;
  label: string;
  icon: ReactElement;
  element: ReactElement;
  // null = always visible (defence-in-depth role check still applies for non-config tabs).
  permission: string | null;
}

const TABS: Tab[] = [
  {
    id: 'config',
    label: 'Configuration',
    icon: <SettingsIcon className="w-4 h-4" />,
    element: <AdminPage />,
    permission: null,
  },
  {
    id: 'users',
    label: 'Users',
    icon: <Shield className="w-4 h-4" />,
    element: <UserManagement />,
    permission: 'admin.users.manage',
  },
  {
    id: 'roles',
    label: 'Roles & Permissions',
    icon: <Shield className="w-4 h-4" />,
    element: <RolesPermissions />,
    permission: 'admin.roles.manage',
  },
  {
    id: 'groups',
    label: 'Groups',
    icon: <UsersRound className="w-4 h-4" />,
    element: <Groups />,
    permission: 'admin.groups.manage',
  },
  {
    id: 'providers',
    label: 'Identity Providers',
    icon: <KeyRound className="w-4 h-4" />,
    element: <IdentityProviders />,
    permission: 'admin.providers.manage',
  },
  {
    id: 'collections',
    label: 'Collection Permissions',
    icon: <FolderLock className="w-4 h-4" />,
    element: <CollectionPermissions />,
    permission: 'admin.collections.manage',
  },
  {
    id: 'api_keys',
    label: 'API Keys',
    icon: <KeyRound className="w-4 h-4" />,
    element: <ApiKeysPanel />,
    permission: 'admin.config.write',
  },
  {
    id: 'features',
    label: 'Feature Flags',
    icon: <ToggleLeft className="w-4 h-4" />,
    element: <FeatureFlagsPanel />,
    permission: 'admin.features.toggle',
  },
  {
    id: 'audit',
    label: 'Audit Log',
    icon: <FileSearch className="w-4 h-4" />,
    element: <AuditLog />,
    permission: 'admin.audit.view',
  },
];

function filterTabs(role: string | undefined, model: PackAuthModel | null): Tab[] {
  return TABS.filter((t) => {
    if (t.permission === null) return true; // Configuration tab — always on
    if (role !== 'admin') return false; // non-admins see only Configuration
    if (model === null) return false; // before model loads, auth tabs hidden
    return model.permissions.includes(t.permission);
  });
}

export function AdminPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [model, setModel] = useState<PackAuthModel | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>('config');

  useEffect(() => {
    let cancelled = false;
    fetchPackModel()
      .then((m) => !cancelled && setModel(m))
      .catch((e: Error) => !cancelled && setModelError(e.message || 'Failed to load pack model'))
      .finally(() => !cancelled && setModelLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleTabs = filterTabs(role, model);
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

      {modelLoading && role === 'admin' && (
        <div className="px-6 py-2 text-xs text-gray-400">Loading pack model…</div>
      )}
      {modelError && role === 'admin' && (
        <div className="px-6 py-2 text-xs text-red-300">
          Could not load pack model — auth tabs hidden. {modelError}
        </div>
      )}

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
        ) : (
          <PanelLoading />
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
