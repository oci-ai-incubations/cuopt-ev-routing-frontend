/**
 * Admin API wrappers (accelerator-pack-auth-service).
 *
 * All endpoints require an authenticated user; most require role=admin.
 * Calls go through `authClient` so the Bearer token is attached and 401s
 * trigger the refresh-then-retry interceptor.
 */

import { authClient } from '@/api/authClient';

import type {
  AdminUser,
  AuditQueryFilters,
  AuditQueryResponse,
  ClaimMapping,
  CollectionPermission,
  CreateMappingPayload,
  CreateProviderPayload,
  CreateRolePayload,
  Group,
  GroupMember,
  IdentityProvider,
  Permission,
  PermissionCheckPayload,
  PermissionCheckResult,
  PermissionLevel,
  Role,
  UserPatch,
  UserRoleAssignment,
} from '@/types/admin';

const BASE = '/auth';

// ─── Users ────────────────────────────────────────────────────────────────
export async function listUsers(): Promise<AdminUser[]> {
  const { data } = await authClient.get<AdminUser[]>(`${BASE}/users`);
  return data;
}

export async function updateUser(id: number, patch: UserPatch): Promise<AdminUser> {
  const { data } = await authClient.patch<AdminUser>(`${BASE}/users/${id}`, patch);
  return data;
}

export async function listUserRoles(userId: number): Promise<UserRoleAssignment[]> {
  const { data } = await authClient.get<UserRoleAssignment[]>(`${BASE}/users/${userId}/roles`);
  return data;
}

export async function assignRole(userId: number, roleId: number): Promise<UserRoleAssignment> {
  const { data } = await authClient.post<UserRoleAssignment>(`${BASE}/users/${userId}/roles`, {
    role_id: roleId,
  });
  return data;
}

export async function removeRoleAssignment(userId: number, assignmentId: number): Promise<void> {
  await authClient.delete(`${BASE}/users/${userId}/roles/${assignmentId}`);
}

// ─── Roles & Permissions ──────────────────────────────────────────────────
export async function listRoles(): Promise<Role[]> {
  const { data } = await authClient.get<Role[]>(`${BASE}/roles`);
  return data;
}

export async function createRole(payload: CreateRolePayload): Promise<Role> {
  const { data } = await authClient.post<Role>(`${BASE}/roles`, payload);
  return data;
}

export async function updateRole(id: number, patch: Partial<CreateRolePayload>): Promise<Role> {
  const { data } = await authClient.patch<Role>(`${BASE}/roles/${id}`, patch);
  return data;
}

export async function deleteRole(id: number): Promise<void> {
  await authClient.delete(`${BASE}/roles/${id}`);
}

export async function setRolePermissions(roleId: number, codenames: string[]): Promise<Role> {
  const { data } = await authClient.put<Role>(`${BASE}/roles/${roleId}/permissions`, {
    permission_codenames: codenames,
  });
  return data;
}

export async function listPermissions(): Promise<Permission[]> {
  const { data } = await authClient.get<Permission[]>(`${BASE}/permissions`);
  return data;
}

export async function checkPermission(
  payload: PermissionCheckPayload,
): Promise<PermissionCheckResult> {
  const { data } = await authClient.post<PermissionCheckResult>(
    `${BASE}/permissions/check`,
    payload,
  );
  return data;
}

// ─── Groups ───────────────────────────────────────────────────────────────
export async function listGroups(): Promise<Group[]> {
  const { data } = await authClient.get<Group[]>(`${BASE}/groups`);
  return data;
}

export async function createGroup(name: string): Promise<Group> {
  const { data } = await authClient.post<Group>(`${BASE}/groups`, { name });
  return data;
}

export async function listGroupMembers(groupId: number): Promise<GroupMember[]> {
  const { data } = await authClient.get<GroupMember[]>(`${BASE}/groups/${groupId}/members`);
  return data;
}

export async function addGroupMember(groupId: number, userId: number): Promise<void> {
  await authClient.post(`${BASE}/groups/${groupId}/members`, { user_id: userId });
}

export async function removeGroupMember(groupId: number, userId: number): Promise<void> {
  await authClient.delete(`${BASE}/groups/${groupId}/members/${userId}`);
}

export async function listGroupRoles(groupId: number): Promise<string[]> {
  const { data } = await authClient.get<string[]>(`${BASE}/groups/${groupId}/roles`);
  return data;
}

export async function setGroupRoles(groupId: number, roles: string[]): Promise<void> {
  await authClient.put(`${BASE}/groups/${groupId}/roles`, { roles });
}

// ─── Identity Providers ───────────────────────────────────────────────────
export async function listProviders(): Promise<IdentityProvider[]> {
  const { data } = await authClient.get<IdentityProvider[]>(`${BASE}/providers`);
  return data;
}

export async function createProvider(payload: CreateProviderPayload): Promise<IdentityProvider> {
  const { data } = await authClient.post<IdentityProvider>(`${BASE}/providers`, payload);
  return data;
}

export async function updateProvider(
  id: number,
  patch: Partial<CreateProviderPayload & { is_active: boolean }>,
): Promise<IdentityProvider> {
  const { data } = await authClient.patch<IdentityProvider>(`${BASE}/providers/${id}`, patch);
  return data;
}

export async function deleteProvider(id: number): Promise<void> {
  await authClient.delete(`${BASE}/providers/${id}`);
}

export async function listClaimMappings(providerId: number): Promise<ClaimMapping[]> {
  const { data } = await authClient.get<ClaimMapping[]>(`${BASE}/providers/${providerId}/mappings`);
  return data;
}

export async function createClaimMapping(
  providerId: number,
  payload: CreateMappingPayload,
): Promise<ClaimMapping> {
  const { data } = await authClient.post<ClaimMapping>(
    `${BASE}/providers/${providerId}/mappings`,
    payload,
  );
  return data;
}

export async function deleteClaimMapping(providerId: number, mappingId: number): Promise<void> {
  await authClient.delete(`${BASE}/providers/${providerId}/mappings/${mappingId}`);
}

// ─── Collection Permissions ───────────────────────────────────────────────
export async function listCollectionPermissions(
  collectionId: string,
): Promise<CollectionPermission[]> {
  const { data } = await authClient.get<CollectionPermission[]>(
    `${BASE}/collections/${encodeURIComponent(collectionId)}/permissions`,
  );
  return data;
}

export async function setCollectionPermission(
  collectionId: string,
  userId: number,
  level: PermissionLevel,
): Promise<CollectionPermission> {
  const { data } = await authClient.post<CollectionPermission>(
    `${BASE}/collections/${encodeURIComponent(collectionId)}/permissions`,
    { user_id: userId, permission_level: level },
  );
  return data;
}

export async function deleteCollectionPermission(
  collectionId: string,
  userId: number,
): Promise<void> {
  await authClient.delete(
    `${BASE}/collections/${encodeURIComponent(collectionId)}/permissions/${userId}`,
  );
}

// ─── Audit Log ────────────────────────────────────────────────────────────
export async function queryAuditLog(filters: AuditQueryFilters): Promise<AuditQueryResponse> {
  const params: Record<string, string | number> = {};
  if (filters.event_type) params.event_type = filters.event_type;
  if (filters.user_id) params.user_id = filters.user_id;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (typeof filters.offset === 'number') params.offset = filters.offset;
  if (typeof filters.limit === 'number') params.limit = filters.limit;
  const { data } = await authClient.get<AuditQueryResponse>(`${BASE}/audit`, { params });
  return data;
}

export async function exportAuditLog(): Promise<Blob> {
  const res = await authClient.get<Blob>(`${BASE}/audit/export`, { responseType: 'blob' });
  return res.data;
}
