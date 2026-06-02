import {
  AlertCircle,
  Cloud,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { fetchPublicProviders, getAuthorizeUrl } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import type { SSOProvider } from '@/types/auth';

type Mode = 'login' | 'register';

export default function Login() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuthStore();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicProviders().then(setProviders);
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');

      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError('Please enter your name');

      return;
    }

    setLoading(true);
    const result =
      mode === 'login' ? await login(email, password) : await register({ email, password, name });

    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Authentication failed');
    }
  };

  const handleSSOClick = async (provider: SSOProvider) => {
    setSsoLoading(provider.slug);
    setError('');

    try {
      const redirectUri = `${window.location.origin}/sso/callback/${provider.slug}`;
      const data = await getAuthorizeUrl(provider.slug, redirectUri);

      sessionStorage.setItem('sso_state', data.state);
      window.location.href = data.authorize_url;
    } catch {
      setError('Failed to start SSO login');
      setSsoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white mb-4 shadow-lg">
            <Cloud className="w-12 h-12 text-oracle-red" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {mode === 'login' ? 'Sign in to' : 'Join'} OCI Route Optimizer
          </h1>
          <p className="text-gray-400 text-sm">Powered by Oracle Cloud Infrastructure</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-oracle-red focus:border-transparent transition-all"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                disabled={loading}
                className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-oracle-red focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  disabled={loading}
                  className="w-full px-4 py-2.5 pr-12 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-oracle-red focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-oracle-red hover:bg-oracle-red-hover disabled:bg-oracle-red/50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg shadow-oracle-red/20"
            >
              {loading && (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              )}
              {!loading && mode === 'login' && (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign in
                </>
              )}
              {!loading && mode !== 'login' && (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create account
                </>
              )}
            </button>

            {providers.length > 0 && (
              <>
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-dark-border" />
                  <span className="text-xs text-gray-500">or</span>
                  <div className="flex-1 h-px bg-dark-border" />
                </div>

                <div className="space-y-2">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      disabled={ssoLoading === provider.slug}
                      onClick={() => handleSSOClick(provider)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-dark-bg border border-dark-border text-white font-medium hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {ssoLoading === provider.slug && (
                        <div className="w-5 h-5 border-2 border-gray-500/30 border-t-gray-300 rounded-full animate-spin" />
                      )}
                      {ssoLoading !== provider.slug && provider.type === 'oidc' && (
                        <KeyRound className="w-4 h-4" />
                      )}
                      {ssoLoading !== provider.slug && provider.type !== 'oidc' && (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      Sign in with {provider.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
                className="text-sm text-oracle-red hover:underline"
              >
                {mode === 'login'
                  ? "Don't have an account? Register"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
