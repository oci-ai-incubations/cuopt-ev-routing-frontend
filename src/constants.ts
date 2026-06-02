import { type PermissionLevel, type AdverseConditionLevel, type UserRole } from './types';

export const AUTH_BASE = '/auth';
export const CUOPT_ADMIN_BASE = '/api/admin';

export const CUOPT_TIMEOUT_MS = 300000;
export const GENAI_TIMEOUT_MS = 120000;

export const WEATHER_SEVERITY_COLORS: Record<AdverseConditionLevel, string> = {
  none: '#22C55E',
  low: '#84CC16',
  moderate: '#F59E0B',
  high: '#EF4444',
  severe: '#7C3AED',
};

export const PAGE_SIZE = 20;

export const EVENT_TYPES = [
  '',
  'login',
  'logout',
  'login_failed',
  'token_refresh',
  'user_created',
  'user_updated',
  'user_deleted',
  'role_assigned',
  'permission_changed',
  'provider_created',
  'group_created',
];

export const LEVEL_VARIANT: Record<PermissionLevel, 'success' | 'info' | 'oracle'> = {
  read: 'success',
  write: 'info',
  manage: 'oracle',
};

export const SOURCE_VARIANT: Record<string, 'success' | 'info' | 'oracle' | 'default'> = {
  local: 'success',
  scim: 'info',
  jit: 'oracle',
};

export const TYPE_VARIANT: Record<string, 'info' | 'oracle' | 'default'> = {
  oidc: 'info',
  saml: 'oracle',
};

export const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
  { value: 'reader', label: 'Reader' },
  { value: 'pending', label: 'Pending' },
];

export const ROLE_VARIANT: Record<UserRole, 'oracle' | 'info' | 'success' | 'warning'> = {
  admin: 'oracle',
  user: 'info',
  reader: 'success',
  pending: 'warning',
};
