/**
 * Admin → Roles & Permissions
 *
 * CRUD on roles, PUT permissions on a selected role. System roles are
 * read-only. Uses /auth/roles, /auth/roles/{id}/permissions, /auth/permissions.
 */

import { Check, Pencil, Plus, Shield, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { createRole, deleteRole, listPermissions, listRoles, setRolePermissions } from '@/api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Modal,
  PanelLoading,
  TextInput,
} from '@/components/Admin/auth/_primitives';
import type { Permission, Role } from '@/types';

export function RolesPermissions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [selectedPermCodenames, setSelectedPermCodenames] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      setRoles(await listRoles());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreateRole = async () => {
    if (!newName.trim()) return;
    setCreating(true);

    try {
      await createRole({ name: newName, description: newDescription });
      setNewName('');
      setNewDescription('');
      setShowCreateModal(false);
      await refresh();
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    await deleteRole(roleId);
    if (selectedRole?.id === roleId) setSelectedRole(null);
    await refresh();
  };

  const startEditPermissions = async (role: Role) => {
    setSelectedRole(role);

    if (allPermissions.length === 0) {
      setAllPermissions(await listPermissions());
    }

    setSelectedPermCodenames(new Set(role.permissions));
    setEditingPermissions(true);
  };

  const togglePerm = (codename: string) => {
    setSelectedPermCodenames((prev) => {
      const next = new Set(prev);

      if (next.has(codename)) next.delete(codename);
      else next.add(codename);

      return next;
    });
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);

    try {
      await setRolePermissions(selectedRole.id, Array.from(selectedPermCodenames));
      setEditingPermissions(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PanelLoading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Roles &amp; Permissions</h2>
        <p className="text-sm text-gray-400 mt-1">Manage roles and their associated permissions</p>
      </div>

      <Card>
        <CardHeader
          title={`Roles (${roles.length})`}
          description="System roles cannot be modified. Custom roles can be edited or deleted."
          icon={<Shield className="w-4 h-4 text-oracle-red" />}
        />
        <CardContent className="space-y-3">
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Role
            </Button>
          </div>

          {roles.map((role) => (
            <div
              key={role.id}
              data-testid={`role-row-${role.id}`}
              className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                selectedRole?.id === role.id
                  ? 'bg-dark-bg border-oracle-red/40'
                  : 'bg-dark-bg border-dark-border hover:border-oracle-red/30'
              }`}
              onClick={() => {
                setSelectedRole(role);
                setEditingPermissions(false);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{role.name}</span>
                    {role.is_system && <Badge variant="oracle">System</Badge>}
                    <Badge variant="info">{role.permissions.length} permissions</Badge>
                  </div>
                  <span className="text-xs text-gray-400 block mt-0.5">{role.description}</span>
                </div>

                {!role.is_system && (
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Edit ${role.name}`}
                      icon={<Pencil className="w-3.5 h-3.5" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        void startEditPermissions(role);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${role.name}`}
                      icon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteRole(role.id);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {roles.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No roles defined</p>
          )}
        </CardContent>
      </Card>

      {selectedRole && (
        <Card>
          <CardHeader
            title={`Permissions for "${selectedRole.name}"`}
            description={
              selectedRole.is_system
                ? 'System role permissions cannot be modified'
                : 'Click "Edit Permissions" to modify'
            }
          />
          <CardContent>
            {editingPermissions ? (
              <div className="space-y-4">
                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                  {allPermissions.map((perm) => (
                    <label
                      key={perm.codename}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-hover cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermCodenames.has(perm.codename)}
                        onChange={() => togglePerm(perm.codename)}
                        className="w-4 h-4 rounded border-dark-border text-oracle-red focus:ring-oracle-red"
                      />
                      <div className="min-w-0">
                        <span className="text-sm font-mono text-white">{perm.codename}</span>
                        <span className="text-xs text-gray-400 block">{perm.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 pt-2 border-t border-dark-border">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={savePermissions}
                    loading={saving}
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPermissions(false)}
                    icon={<X className="w-3.5 h-3.5" />}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedRole.permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedRole.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="text-xs px-2.5 py-1 rounded-md bg-dark-bg border border-dark-border text-white font-mono"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">No permissions assigned</p>
                )}
                {!selectedRole.is_system && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void startEditPermissions(selectedRole)}
                    icon={<Pencil className="w-3.5 h-3.5" />}
                  >
                    Edit Permissions
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Role"
        description="Define a new custom role"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Name</label>
            <TextInput value={newName} onChange={setNewName} placeholder="e.g. editor" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Description</label>
            <TextInput
              value={newDescription}
              onChange={setNewDescription}
              placeholder="Role description"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleCreateRole()}
              loading={creating}
              disabled={!newName.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default RolesPermissions;
