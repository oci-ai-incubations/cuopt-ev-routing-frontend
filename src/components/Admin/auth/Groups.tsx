/**
 * Admin → Groups
 *
 * List groups, manage members, assign roles collectively.
 * Uses /auth/groups, /auth/groups/{id}/members, /auth/groups/{id}/roles.
 */

import { Plus, Trash2, UserPlus, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  addGroupMember,
  createGroup,
  listGroupMembers,
  listGroupRoles,
  listGroups,
  listRoles,
  removeGroupMember,
  setGroupRoles,
} from '@/api/admin';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Modal,
  PanelLoading,
  Spinner,
  TextInput,
} from '@/components/Admin/auth/_primitives';

import type { Group, GroupMember } from '@/types/admin';

const SOURCE_VARIANT: Record<string, 'success' | 'info' | 'oracle' | 'default'> = {
  local: 'success',
  scim: 'info',
  jit: 'oracle',
};

export function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [savingRoles, setSavingRoles] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const refreshGroups = useCallback(async () => {
    setLoading(true);
    try {
      setGroups(await listGroups());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshGroups();
  }, [refreshGroups]);

  const refreshAvailableRoles = useCallback(async () => {
    const roles = await listRoles();
    setAvailableRoles(roles.map((r) => r.name));
  }, []);

  const selectGroup = async (group: Group) => {
    setSelectedGroup(group);
    setLoadingMembers(true);
    try {
      const [m, r] = await Promise.all([listGroupMembers(group.id), listGroupRoles(group.id)]);
      setMembers(m);
      setSelectedRoles(new Set(r));
      if (availableRoles.length === 0) await refreshAvailableRoles();
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createGroup(newName);
      setNewName('');
      setShowCreateModal(false);
      await refreshGroups();
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedGroup || !addMemberUserId.trim()) return;
    setAddingMember(true);
    try {
      await addGroupMember(selectedGroup.id, parseInt(addMemberUserId, 10));
      setAddMemberUserId('');
      setShowAddMemberModal(false);
      setMembers(await listGroupMembers(selectedGroup.id));
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedGroup) return;
    await removeGroupMember(selectedGroup.id, userId);
    setMembers(await listGroupMembers(selectedGroup.id));
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const handleSaveRoles = async () => {
    if (!selectedGroup) return;
    setSavingRoles(true);
    try {
      await setGroupRoles(selectedGroup.id, Array.from(selectedRoles));
    } finally {
      setSavingRoles(false);
    }
  };

  if (loading) return <PanelLoading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Groups</h2>
        <p className="text-sm text-gray-400 mt-1">
          Manage groups, members, and group role assignments
        </p>
      </div>

      <Card>
        <CardHeader
          title={`Groups (${groups.length})`}
          description="Groups organize users and can be assigned roles collectively"
          icon={<UsersRound className="w-4 h-4 text-oracle-red" />}
        />
        <CardContent className="space-y-3">
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Group
            </Button>
          </div>

          {groups.map((group) => (
            <div
              key={group.id}
              data-testid={`group-row-${group.id}`}
              className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                selectedGroup?.id === group.id
                  ? 'bg-dark-bg border-oracle-red/40'
                  : 'bg-dark-bg border-dark-border hover:border-oracle-red/30'
              }`}
              onClick={() => void selectGroup(group)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">
                  {group.display_name || group.name}
                </span>
                <Badge variant={SOURCE_VARIANT[group.source] ?? 'default'}>{group.source}</Badge>
              </div>
              <span className="text-xs text-gray-400 block mt-0.5">{group.name}</span>
            </div>
          ))}

          {groups.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No groups created</p>
          )}
        </CardContent>
      </Card>

      {selectedGroup && (
        <Card>
          <CardHeader
            title={`Members of "${selectedGroup.display_name || selectedGroup.name}"`}
            description="Add or remove users from this group"
          />
          <CardContent>
            {loadingMembers ? (
              <div className="flex items-center justify-center py-6">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="space-y-4">
                {members.length > 0 ? (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-dark-bg border border-dark-border"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-white">{member.name}</span>
                          <span className="text-xs text-gray-400 block">{member.email}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Remove ${member.name}`}
                          onClick={() => void handleRemoveMember(member.id)}
                          icon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">
                    No members in this group
                  </p>
                )}

                <div className="pt-2 border-t border-dark-border">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAddMemberModal(true)}
                    icon={<UserPlus className="w-3.5 h-3.5" />}
                  >
                    Add Member
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedGroup && (
        <Card>
          <CardHeader
            title="Group Roles"
            description={`Assign roles to all members of "${selectedGroup.display_name || selectedGroup.name}"`}
          />
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {availableRoles.map((roleName) => (
                <label
                  key={roleName}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-hover cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.has(roleName)}
                    onChange={() => toggleRole(roleName)}
                    className="w-4 h-4 rounded border-dark-border text-oracle-red focus:ring-oracle-red"
                  />
                  <span className="text-sm text-white">{roleName}</span>
                </label>
              ))}
              {availableRoles.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">No roles available</p>
              )}
            </div>
            <Button variant="primary" size="sm" onClick={handleSaveRoles} loading={savingRoles}>
              Save Roles
            </Button>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Group"
        description="Create a new user group"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Name</label>
            <TextInput value={newName} onChange={setNewName} placeholder="e.g. engineering" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleCreate()}
              loading={creating}
              disabled={!newName.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Add Member"
        description="Add a user to this group by user ID"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">User ID</label>
            <TextInput
              value={addMemberUserId}
              onChange={setAddMemberUserId}
              placeholder="Enter user ID"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowAddMemberModal(false)}
              disabled={addingMember}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleAddMember()}
              loading={addingMember}
              disabled={!addMemberUserId.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Groups;
