/**
 * Admin → User Management
 *
 * Lists registered users, lets an admin change role and toggle active status.
 * Uses /auth/users (GET) and /auth/users/{id} (PATCH).
 */

import { Shield, UserCheck, UserX } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { listUsers, updateUser } from '@/api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  PanelLoading,
  Select,
} from '@/components/Admin/auth/_primitives';
import { ROLE_OPTIONS, ROLE_VARIANT } from '@/constants';
import type { AdminUser, UserRole } from '@/types';

export function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      setUsers(await listUsers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const applyPatch = async (userId: number, patch: { role?: UserRole; is_active?: boolean }) => {
    setUpdatingId(userId);

    try {
      const updated = await updateUser(userId, patch);

      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <PanelLoading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">User Management</h2>
        <p className="text-sm text-gray-400 mt-1">Approve users, assign roles, and manage access</p>
      </div>

      <Card>
        <CardHeader
          title={`Users (${users.length})`}
          description="Admin · full access. User · read/write. Reader · read-only. Pending · awaiting approval."
          icon={<Shield className="w-4 h-4 text-oracle-red" />}
        />
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              data-testid={`user-row-${user.id}`}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                user.is_active
                  ? 'bg-dark-bg border-dark-border'
                  : 'bg-dark-bg/50 border-dark-border/50 opacity-60'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">{user.name}</span>
                  <Badge variant={ROLE_VARIANT[user.role] ?? 'info'}>{user.role}</Badge>
                  {!user.is_active && <Badge variant="error">Inactive</Badge>}
                </div>
                <span className="text-xs text-gray-400 truncate block">{user.email}</span>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Select<UserRole>
                  value={user.role}
                  onChange={(v) => applyPatch(user.id, { role: v })}
                  options={ROLE_OPTIONS}
                  className="text-xs"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={updatingId === user.id}
                  onClick={() => applyPatch(user.id, { is_active: !user.is_active })}
                  icon={
                    user.is_active ? (
                      <UserX className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 text-green-400" />
                    )
                  }
                >
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No users registered yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default UserManagement;
