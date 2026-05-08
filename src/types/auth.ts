export type UserRole = 'admin' | 'user' | 'reader' | 'pending';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
  user: User;
}

export interface SSOProvider {
  id: number;
  type: 'oidc' | 'saml';
  name: string;
  slug: string;
}

export interface SSOAuthorizeResponse {
  authorize_url: string;
  state: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

/** JWT claims emitted by accelerator-pack-auth-service. */
export interface AccessTokenClaims {
  sub: string;
  email?: string;
  name?: string;
  role?: UserRole;
  exp?: number;
  iat?: number;
}
