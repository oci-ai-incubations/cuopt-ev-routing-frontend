import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';

export default function SSOCallback() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const ssoLogin = useAuthStore((s) => s.ssoLogin);
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const expectedState = sessionStorage.getItem('sso_state');

    sessionStorage.removeItem('sso_state');

    if (!slug) {
      setError('Missing provider in callback URL');
      return;
    }
    if (!code) {
      setError('Missing authorization code from identity provider');
      return;
    }
    if (!state) {
      setError('Missing state from identity provider');
      return;
    }
    // Require the sessionStorage CSRF token to be present and match. The
    // server-side single-use state check (auth-service consume_sso_state)
    // remains the load-bearing protection, but the FE check now fails
    // closed: a fresh-tab callback with no prior /authorize call must
    // reject rather than silently fall through to the token exchange.
    if (!expectedState || state !== expectedState) {
      setError('SSO state mismatch — possible CSRF. Please try signing in again.');
      return;
    }

    const redirectUri = `${window.location.origin}/sso/callback/${slug}`;
    ssoLogin(slug, code, redirectUri, state).then((result) => {
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'SSO authentication failed');
      }
    });
  }, [slug, searchParams, ssoLogin, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div
          role="alert"
          className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-6 text-center"
        >
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 mb-4">{error}</p>
          <Link to="/login" className="text-oracle-red hover:underline">
            Try signing in again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-dark-bg flex items-center justify-center"
    >
      <div className="w-6 h-6 border-2 border-oracle-red/30 border-t-oracle-red rounded-full animate-spin" />
      <p className="ml-3 text-gray-300">Signing you in&hellip;</p>
    </div>
  );
}
