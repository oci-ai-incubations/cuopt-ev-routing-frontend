/**
 * TS shapes for the accelerator-pack-auth-service admin endpoints +
 * cuopt-ev-routing-backend's /api/admin/config* endpoints.
 *
 * Aligned with auth-service Pydantic models — keep in sync if those change.
 */

import type { UserRole } from '@/types/auth';

// ─── Pack model (from auth-service /auth/pack/model) ──────────────────────
export interface PackAuthModel {
  pack_id: string;
  roles: string[];
  permissions: string[];
  role_permissions: Record<string, string[]>;
}

// ─── Instance settings (from cuopt-backend /api/admin/config) ─────────────
export interface InstanceConfig {
  google_maps_api_key: string; // "***" when set, "" when unset
  openweathermap_api_key: string; // "***" when set, "" when unset
  genai_chat_enabled: boolean;
  weather_enabled: boolean;
  sso_enabled: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface ApiKeysUpdate {
  google_maps_api_key?: string;
  openweathermap_api_key?: string;
}

export interface FeatureFlagsUpdate {
  genai_chat_enabled?: boolean;
  weather_enabled?: boolean;
  sso_enabled?: boolean;
}

// ─── Users ────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface UserPatch {
  role?: UserRole;
  is_active?: boolean;
  name?: string;
}

// ─── Roles & Permissions ──────────────────────────────────────────────────
export interface Permission {
  id: number;
  codename: string;
  description: string;
  resource_type: string | null;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  permissions: string[];
}

export interface CreateRolePayload {
  name: string;
  description: string;
}

export interface PermissionCheckPayload {
  user_id: number;
  permission_codename: string;
  resource_type?: string;
  resource_id?: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface UserRoleAssignment {
  id: number;
  user_id: number;
  role_id: number;
  role_name: string;
  granted_at: string;
}

// ─── Groups ───────────────────────────────────────────────────────────────
export interface GroupMember {
  id: number;
  email: string;
  name: string;
}

export interface Group {
  id: number;
  name: string;
  display_name: string;
  source: 'local' | 'scim' | 'jit' | string;
  members?: GroupMember[];
  roles?: string[];
}

// ─── Identity Providers ───────────────────────────────────────────────────
export interface ClaimMapping {
  id: number;
  provider_id: number;
  claim_key: string;
  claim_value_pattern: string;
  target_role: string;
  is_regex: boolean;
}

export interface IdentityProvider {
  id: number;
  name: string;
  type: 'oidc' | 'saml' | string;
  slug: string;
  is_active: boolean;
  config: Record<string, unknown>;
  claim_mappings?: ClaimMapping[];
}

export interface CreateProviderPayload {
  type: 'oidc' | 'saml';
  name: string;
  slug: string;
  config: Record<string, unknown>;
}

export interface CreateMappingPayload {
  claim_key: string;
  claim_value_pattern: string;
  target_role: string;
  is_regex: boolean;
}

// ─── Collection Permissions ───────────────────────────────────────────────
export type PermissionLevel = 'read' | 'write' | 'manage';

export interface CollectionPermission {
  id: number;
  user_id: number;
  collection_id: string;
  permission_level: PermissionLevel;
  user_email?: string;
}

// ─── Audit Log ────────────────────────────────────────────────────────────
export interface AuditLogEntry {
  id: number;
  timestamp: string;
  event_type: string;
  actor_email: string;
  target: string;
  result: 'success' | 'failure' | string;
  details?: Record<string, unknown>;
}

export interface AuditQueryResponse {
  items: AuditLogEntry[];
  total: number;
}

export interface AuditQueryFilters {
  event_type?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  offset?: number;
  limit?: number;
}
