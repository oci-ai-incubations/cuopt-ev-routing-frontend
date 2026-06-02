import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addGroupMember,
  assignRole,
  checkPermission,
  createClaimMapping,
  createGroup,
  createProvider,
  createRole,
  deleteClaimMapping,
  deleteCollectionPermission,
  deleteProvider,
  deleteRole,
  exportAuditLog,
  fetchInstanceConfig,
  fetchPackModel,
  listClaimMappings,
  listCollectionPermissions,
  listGroupMembers,
  listGroupRoles,
  listGroups,
  listPermissions,
  listProviders,
  listRoles,
  listUserRoles,
  listUsers,
  queryAuditLog,
  removeGroupMember,
  removeRoleAssignment,
  setCollectionPermission,
  setGroupRoles,
  setRolePermissions,
  updateApiKeys,
  updateFeatures,
  updateProvider,
  updateRole,
  updateUser,
  authClient,
} from '@/api';

vi.mock('@/api/authClient', () => ({
  authClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

// ─── Pack model ──────────────────────────────────────────────────────────────

describe('fetchPackModel', () => {
  it('fetches pack model from /auth/pack/model', async () => {
    const model = { pack_id: 'cuopt', roles: ['admin'], permissions: [], role_permissions: {} };

    vi.mocked(authClient.get).mockResolvedValue({ data: model });

    const result = await fetchPackModel();

    expect(authClient.get).toHaveBeenCalledWith('/auth/pack/model');
    expect(result).toEqual(model);
  });
});

// ─── Instance config ──────────────────────────────────────────────────────────

describe('fetchInstanceConfig', () => {
  it('fetches config from /api/admin/config', async () => {
    const config = {
      google_maps_api_key: '***',
      openweathermap_api_key: '',
      genai_chat_enabled: true,
      weather_enabled: false,
      sso_enabled: true,
      updated_at: '2024-01-01',
      updated_by: null,
    };

    vi.mocked(authClient.get).mockResolvedValue({ data: config });

    const result = await fetchInstanceConfig();

    expect(authClient.get).toHaveBeenCalledWith('/api/admin/config');
    expect(result).toEqual(config);
  });
});

describe('updateApiKeys', () => {
  it('patches api keys and returns updated config', async () => {
    const updated = { google_maps_api_key: '***', openweathermap_api_key: '***' };

    vi.mocked(authClient.patch).mockResolvedValue({ data: updated });

    const result = await updateApiKeys({ google_maps_api_key: 'new-key' });

    expect(authClient.patch).toHaveBeenCalledWith('/api/admin/config/api-keys', {
      google_maps_api_key: 'new-key',
    });
    expect(result).toEqual(updated);
  });
});

describe('updateFeatures', () => {
  it('patches feature flags and returns updated config', async () => {
    const updated = { genai_chat_enabled: false };

    vi.mocked(authClient.patch).mockResolvedValue({ data: updated });

    const result = await updateFeatures({ genai_chat_enabled: false });

    expect(authClient.patch).toHaveBeenCalledWith('/api/admin/config/features', {
      genai_chat_enabled: false,
    });
    expect(result).toEqual(updated);
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────

describe('listUsers', () => {
  it('returns array of admin users', async () => {
    const users = [
      {
        id: 1,
        email: 'a@b.com',
        name: 'Alice',
        role: 'admin',
        is_active: true,
        created_at: '2024-01-01',
      },
    ];

    vi.mocked(authClient.get).mockResolvedValue({ data: users });

    const result = await listUsers();

    expect(authClient.get).toHaveBeenCalledWith('/auth/users');
    expect(result).toEqual(users);
  });
});

describe('updateUser', () => {
  it('patches user by id', async () => {
    const patched = {
      id: 5,
      email: 'x@y.com',
      name: 'X',
      role: 'user',
      is_active: false,
      created_at: '2024-01-01',
    };

    vi.mocked(authClient.patch).mockResolvedValue({ data: patched });

    const result = await updateUser(5, { is_active: false });

    expect(authClient.patch).toHaveBeenCalledWith('/auth/users/5', { is_active: false });
    expect(result).toEqual(patched);
  });
});

describe('listUserRoles', () => {
  it('fetches role assignments for a user', async () => {
    const assignments = [{ id: 1, user_id: 3, role_id: 2, role_name: 'admin' }];

    vi.mocked(authClient.get).mockResolvedValue({ data: assignments });

    const result = await listUserRoles(3);

    expect(authClient.get).toHaveBeenCalledWith('/auth/users/3/roles');
    expect(result).toEqual(assignments);
  });
});

describe('assignRole', () => {
  it('posts role assignment to user', async () => {
    const assignment = { id: 10, user_id: 3, role_id: 2 };

    vi.mocked(authClient.post).mockResolvedValue({ data: assignment });

    const result = await assignRole(3, 2);

    expect(authClient.post).toHaveBeenCalledWith('/auth/users/3/roles', { role_id: 2 });
    expect(result).toEqual(assignment);
  });
});

describe('removeRoleAssignment', () => {
  it('deletes role assignment by ids', async () => {
    vi.mocked(authClient.delete).mockResolvedValue({});

    await removeRoleAssignment(3, 10);

    expect(authClient.delete).toHaveBeenCalledWith('/auth/users/3/roles/10');
  });
});

// ─── Roles & Permissions ──────────────────────────────────────────────────────

describe('listRoles', () => {
  it('fetches all roles', async () => {
    const roles = [{ id: 1, name: 'admin', description: '' }];

    vi.mocked(authClient.get).mockResolvedValue({ data: roles });

    const result = await listRoles();

    expect(authClient.get).toHaveBeenCalledWith('/auth/roles');
    expect(result).toEqual(roles);
  });
});

describe('createRole', () => {
  it('posts new role and returns created role', async () => {
    const role = { id: 5, name: 'editor', description: 'Can edit' };

    vi.mocked(authClient.post).mockResolvedValue({ data: role });

    const result = await createRole({ name: 'editor', description: 'Can edit' });

    expect(authClient.post).toHaveBeenCalledWith('/auth/roles', {
      name: 'editor',
      description: 'Can edit',
    });
    expect(result).toEqual(role);
  });
});

describe('updateRole', () => {
  it('patches role by id', async () => {
    const updated = { id: 5, name: 'editor-v2', description: 'Updated' };

    vi.mocked(authClient.patch).mockResolvedValue({ data: updated });

    const result = await updateRole(5, { name: 'editor-v2' });

    expect(authClient.patch).toHaveBeenCalledWith('/auth/roles/5', { name: 'editor-v2' });
    expect(result).toEqual(updated);
  });
});

describe('deleteRole', () => {
  it('deletes role by id', async () => {
    vi.mocked(authClient.delete).mockResolvedValue({});

    await deleteRole(5);

    expect(authClient.delete).toHaveBeenCalledWith('/auth/roles/5');
  });
});

describe('setRolePermissions', () => {
  it('puts permission codenames for role', async () => {
    const role = { id: 2, name: 'editor', permissions: ['view', 'edit'] };

    vi.mocked(authClient.put).mockResolvedValue({ data: role });

    const result = await setRolePermissions(2, ['view', 'edit']);

    expect(authClient.put).toHaveBeenCalledWith('/auth/roles/2/permissions', {
      permission_codenames: ['view', 'edit'],
    });
    expect(result).toEqual(role);
  });
});

describe('listPermissions', () => {
  it('fetches all permissions', async () => {
    const perms = [{ id: 1, codename: 'view', description: 'Can view' }];

    vi.mocked(authClient.get).mockResolvedValue({ data: perms });

    const result = await listPermissions();

    expect(authClient.get).toHaveBeenCalledWith('/auth/permissions');
    expect(result).toEqual(perms);
  });
});

describe('checkPermission', () => {
  it('posts permission check payload and returns result', async () => {
    const checkResult = { allowed: true };

    vi.mocked(authClient.post).mockResolvedValue({ data: checkResult });

    const result = await checkPermission({ user_id: 1, permission_codename: 'edit' });

    expect(authClient.post).toHaveBeenCalledWith('/auth/permissions/check', {
      user_id: 1,
      permission_codename: 'edit',
    });
    expect(result).toEqual(checkResult);
  });
});

// ─── Groups ───────────────────────────────────────────────────────────────────

describe('listGroups', () => {
  it('fetches all groups', async () => {
    const groups = [{ id: 1, name: 'Team A' }];

    vi.mocked(authClient.get).mockResolvedValue({ data: groups });

    const result = await listGroups();

    expect(authClient.get).toHaveBeenCalledWith('/auth/groups');
    expect(result).toEqual(groups);
  });
});

describe('createGroup', () => {
  it('posts group name and returns created group', async () => {
    const group = { id: 3, name: 'Team B' };

    vi.mocked(authClient.post).mockResolvedValue({ data: group });

    const result = await createGroup('Team B');

    expect(authClient.post).toHaveBeenCalledWith('/auth/groups', { name: 'Team B' });
    expect(result).toEqual(group);
  });
});

describe('listGroupMembers', () => {
  it('fetches members of a group', async () => {
    const members = [{ id: 1, user_id: 7, group_id: 3 }];

    vi.mocked(authClient.get).mockResolvedValue({ data: members });

    const result = await listGroupMembers(3);

    expect(authClient.get).toHaveBeenCalledWith('/auth/groups/3/members');
    expect(result).toEqual(members);
  });
});

describe('addGroupMember', () => {
  it('posts user_id to group members', async () => {
    vi.mocked(authClient.post).mockResolvedValue({});

    await addGroupMember(3, 7);

    expect(authClient.post).toHaveBeenCalledWith('/auth/groups/3/members', { user_id: 7 });
  });
});

describe('removeGroupMember', () => {
  it('deletes user from group', async () => {
    vi.mocked(authClient.delete).mockResolvedValue({});

    await removeGroupMember(3, 7);

    expect(authClient.delete).toHaveBeenCalledWith('/auth/groups/3/members/7');
  });
});

describe('listGroupRoles', () => {
  it('fetches roles for a group', async () => {
    vi.mocked(authClient.get).mockResolvedValue({ data: ['admin', 'editor'] });

    const result = await listGroupRoles(3);

    expect(authClient.get).toHaveBeenCalledWith('/auth/groups/3/roles');
    expect(result).toEqual(['admin', 'editor']);
  });
});

describe('setGroupRoles', () => {
  it('puts roles for a group', async () => {
    vi.mocked(authClient.put).mockResolvedValue({});

    await setGroupRoles(3, ['viewer']);

    expect(authClient.put).toHaveBeenCalledWith('/auth/groups/3/roles', { roles: ['viewer'] });
  });
});

// ─── Identity Providers ───────────────────────────────────────────────────────

describe('listProviders', () => {
  it('fetches all identity providers', async () => {
    const providers = [{ id: 1, slug: 'google', type: 'oidc', name: 'Google', is_active: true }];

    vi.mocked(authClient.get).mockResolvedValue({ data: providers });

    const result = await listProviders();

    expect(authClient.get).toHaveBeenCalledWith('/auth/providers');
    expect(result).toEqual(providers);
  });
});

describe('createProvider', () => {
  it('posts new provider payload', async () => {
    const provider = { id: 2, slug: 'okta', type: 'oidc', name: 'Okta', is_active: true };

    vi.mocked(authClient.post).mockResolvedValue({ data: provider });

    const result = await createProvider({
      slug: 'okta',
      type: 'oidc',
      name: 'Okta',
      config: {
        client_id: 'cid',
        client_secret: 'sec',
        discovery_url: 'https://okta.example.com/.well-known/openid-configuration',
      },
    });

    expect(authClient.post).toHaveBeenCalledWith(
      '/auth/providers',
      expect.objectContaining({ slug: 'okta' }),
    );
    expect(result).toEqual(provider);
  });
});

describe('updateProvider', () => {
  it('patches provider by id', async () => {
    const updated = { id: 2, is_active: false };

    vi.mocked(authClient.patch).mockResolvedValue({ data: updated });

    const result = await updateProvider(2, { is_active: false });

    expect(authClient.patch).toHaveBeenCalledWith('/auth/providers/2', { is_active: false });
    expect(result).toEqual(updated);
  });
});

describe('deleteProvider', () => {
  it('deletes provider by id', async () => {
    vi.mocked(authClient.delete).mockResolvedValue({});

    await deleteProvider(2);

    expect(authClient.delete).toHaveBeenCalledWith('/auth/providers/2');
  });
});

describe('listClaimMappings', () => {
  it('fetches claim mappings for a provider', async () => {
    const mappings = [{ id: 1, provider_id: 2, claim: 'email', attribute: 'email' }];

    vi.mocked(authClient.get).mockResolvedValue({ data: mappings });

    const result = await listClaimMappings(2);

    expect(authClient.get).toHaveBeenCalledWith('/auth/providers/2/mappings');
    expect(result).toEqual(mappings);
  });
});

describe('createClaimMapping', () => {
  it('posts new claim mapping for provider', async () => {
    const mapping = { id: 5, provider_id: 2, claim: 'groups', attribute: 'role' };

    vi.mocked(authClient.post).mockResolvedValue({ data: mapping });

    const result = await createClaimMapping(2, {
      claim_key: 'groups',
      claim_value_pattern: 'role',
      target_role: 'admin',
      is_regex: false,
    });

    expect(authClient.post).toHaveBeenCalledWith('/auth/providers/2/mappings', {
      claim_key: 'groups',
      claim_value_pattern: 'role',
      target_role: 'admin',
      is_regex: false,
    });
    expect(result).toEqual(mapping);
  });
});

describe('deleteClaimMapping', () => {
  it('deletes claim mapping by provider and mapping id', async () => {
    vi.mocked(authClient.delete).mockResolvedValue({});

    await deleteClaimMapping(2, 5);

    expect(authClient.delete).toHaveBeenCalledWith('/auth/providers/2/mappings/5');
  });
});

// ─── Collection Permissions ───────────────────────────────────────────────────

describe('listCollectionPermissions', () => {
  it('fetches permissions for a collection, URL-encoding the id', async () => {
    const perms = [{ id: 1, collection_id: 'my-col', user_id: 3, permission_level: 'read' }];

    vi.mocked(authClient.get).mockResolvedValue({ data: perms });

    const result = await listCollectionPermissions('my-col');

    expect(authClient.get).toHaveBeenCalledWith('/auth/collections/my-col/permissions');
    expect(result).toEqual(perms);
  });

  it('URL-encodes special characters in collection id', async () => {
    vi.mocked(authClient.get).mockResolvedValue({ data: [] });

    await listCollectionPermissions('col/with spaces');

    expect(authClient.get).toHaveBeenCalledWith(
      `/auth/collections/${encodeURIComponent('col/with spaces')}/permissions`,
    );
  });
});

describe('setCollectionPermission', () => {
  it('posts permission for a collection user', async () => {
    const perm = { id: 1, collection_id: 'my-col', user_id: 3, permission_level: 'write' };

    vi.mocked(authClient.post).mockResolvedValue({ data: perm });

    const result = await setCollectionPermission('my-col', 3, 'write');

    expect(authClient.post).toHaveBeenCalledWith('/auth/collections/my-col/permissions', {
      user_id: 3,
      permission_level: 'write',
    });
    expect(result).toEqual(perm);
  });
});

describe('deleteCollectionPermission', () => {
  it('deletes user permission for a collection', async () => {
    vi.mocked(authClient.delete).mockResolvedValue({});

    await deleteCollectionPermission('my-col', 3);

    expect(authClient.delete).toHaveBeenCalledWith('/auth/collections/my-col/permissions/3');
  });
});

// ─── Audit Log ────────────────────────────────────────────────────────────────

describe('queryAuditLog', () => {
  it('fetches audit log with filters as query params', async () => {
    const response = { events: [], total: 0 };

    vi.mocked(authClient.get).mockResolvedValue({ data: response });

    const result = await queryAuditLog({ event_type: 'login', user_id: '1', limit: 20, offset: 0 });

    expect(authClient.get).toHaveBeenCalledWith('/auth/audit', {
      params: { event_type: 'login', user_id: '1', limit: 20, offset: 0 },
    });
    expect(result).toEqual(response);
  });

  it('omits undefined filters from params', async () => {
    vi.mocked(authClient.get).mockResolvedValue({ data: { events: [], total: 0 } });

    await queryAuditLog({});

    const call = vi.mocked(authClient.get).mock.calls[0];

    expect(call[1]).toEqual({ params: {} });
  });
});

describe('exportAuditLog', () => {
  it('fetches audit log export as blob', async () => {
    const blob = new Blob(['csv-content'], { type: 'text/csv' });

    vi.mocked(authClient.get).mockResolvedValue({ data: blob });

    const result = await exportAuditLog();

    expect(authClient.get).toHaveBeenCalledWith('/auth/audit/export', { responseType: 'blob' });
    expect(result).toBe(blob);
  });
});
