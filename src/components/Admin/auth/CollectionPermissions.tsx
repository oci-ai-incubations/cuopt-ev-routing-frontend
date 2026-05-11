/**
 * Admin → Collection Permissions
 *
 * Per-collection user permission management (legacy collection-permissions API).
 *
 * cuopt has no Tanstack-Query collections endpoint of its own; the operator
 * types the collection identifier directly. The mechanism is preserved for
 * compatibility with packs that DO have collections (paas_rag, dox_pack).
 */

import { FolderLock, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  deleteCollectionPermission,
  listCollectionPermissions,
  listUsers,
  setCollectionPermission,
} from '@/api/admin';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  PanelLoading,
  Select,
  Spinner,
  TextInput,
} from '@/components/Admin/auth/_primitives';

import type {
  AdminUser,
  CollectionPermission,
  PermissionLevel,
} from '@/types/admin';

const LEVEL_VARIANT: Record<PermissionLevel, 'success' | 'info' | 'oracle'> = {
  read: 'success',
  write: 'info',
  manage: 'oracle',
};

export function CollectionPermissions() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [collectionId, setCollectionId] = useState('');
  const [activeCollectionId, setActiveCollectionId] = useState('');
  const [perms, setPerms] = useState<CollectionPermission[]>([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [addUserId, setAddUserId] = useState('');
  const [addLevel, setAddLevel] = useState<PermissionLevel>('read');

  useEffect(() => {
    (async () => {
      try {
        setUsers(await listUsers());
      } finally {
        setUsersLoading(false);
      }
    })().catch(() => undefined);
  }, []);

  const fetchPerms = useCallback(async (id: string) => {
    if (!id) {
      setPerms([]);
      return;
    }
    setPermsLoading(true);
    try {
      setPerms(await listCollectionPermissions(id));
    } finally {
      setPermsLoading(false);
    }
  }, []);

  const loadCollection = async () => {
    if (!collectionId.trim()) return;
    setActiveCollectionId(collectionId.trim());
    await fetchPerms(collectionId.trim());
  };

  const handleAssign = async () => {
    if (!activeCollectionId || !addUserId) return;
    await setCollectionPermission(activeCollectionId, parseInt(addUserId, 10), addLevel);
    setAddUserId('');
    await fetchPerms(activeCollectionId);
  };

  const handleRevoke = async (userId: number) => {
    if (!activeCollectionId) return;
    await deleteCollectionPermission(activeCollectionId, userId);
    await fetchPerms(activeCollectionId);
  };

  if (usersLoading) return <PanelLoading />;

  const assignable = users.filter((u) => u.role !== 'admin' && u.role !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Collection Permissions</h2>
        <p className="text-sm text-gray-400 mt-1">
          Per-collection user access. Admins always have full access; assign read/write/manage to
          users and readers.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Select Collection"
          description="Enter a collection identifier and load its access list"
          icon={<FolderLock className="w-4 h-4 text-oracle-red" />}
        />
        <CardContent>
          <div className="flex gap-2">
            <TextInput
              value={collectionId}
              onChange={setCollectionId}
              placeholder="e.g. cuopt-routes"
            />
            <Button variant="primary" size="md" onClick={() => void loadCollection()}>
              Load
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeCollectionId && (
        <Card>
          <CardHeader
            title="Access List"
            description={`Permissions for collection "${activeCollectionId}"`}
          />
          <CardContent>
            {permsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="space-y-4">
                {perms.length > 0 ? (
                  <div className="space-y-2">
                    {perms.map((perm) => (
                      <div
                        key={perm.id}
                        data-testid={`perm-row-${perm.id}`}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-dark-bg border border-dark-border"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">
                            {perm.user_email ?? `user #${perm.user_id}`}
                          </span>
                          <Badge variant={LEVEL_VARIANT[perm.permission_level]}>
                            {perm.permission_level}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Revoke"
                          onClick={() => void handleRevoke(perm.user_id)}
                          icon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">
                    No user-specific permissions. Only admins can access this collection.
                  </p>
                )}

                <div className="flex gap-2 pt-2 border-t border-dark-border">
                  <select
                    value={addUserId}
                    onChange={(e) => setAddUserId(e.target.value)}
                    className="flex-1 bg-dark-bg border border-dark-border text-white text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-oracle-red"
                  >
                    <option value="">Select user…</option>
                    {assignable.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  <Select<PermissionLevel>
                    value={addLevel}
                    onChange={setAddLevel}
                    options={[
                      { value: 'read', label: 'Read' },
                      { value: 'write', label: 'Write' },
                      { value: 'manage', label: 'Manage' },
                    ]}
                    className="text-xs"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void handleAssign()}
                    disabled={!addUserId}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Assign
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CollectionPermissions;
