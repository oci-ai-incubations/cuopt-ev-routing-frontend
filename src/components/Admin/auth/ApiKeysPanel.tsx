/**
 * API Keys panel — admin-only.
 *
 * Reads + writes the cuopt-backend's instance_settings table via
 * /api/admin/config* endpoints. Sensitive values come back redacted to
 * "***" on GET; an empty input means "no change", an empty-then-save
 * means "clear", and any other value replaces.
 */

import { KeyRound, Save } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';

import { fetchInstanceConfig, updateApiKeys } from '@/api';

import { Button, Card, CardContent, CardHeader, PanelLoading, TextInput } from './_primitives';

interface FormState {
  google_maps_api_key: string;
  openweathermap_api_key: string;
}

const EMPTY: FormState = { google_maps_api_key: '', openweathermap_api_key: '' };

export function ApiKeysPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saved'>('idle');
  // Whether each key is currently set on the server (shown as "***" placeholder)
  const [hasGoogleMaps, setHasGoogleMaps] = useState(false);
  const [hasOpenWeather, setHasOpenWeather] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    fetchInstanceConfig()
      .then((cfg) => {
        if (cancelled) return;
        setHasGoogleMaps(cfg.google_maps_api_key === '***');
        setHasOpenWeather(cfg.openweathermap_api_key === '***');
      })
      .catch((e: Error) => !cancelled && setError(e.message || 'Failed to load config'))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PanelLoading />;

  function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setStatus('idle');

    // Build payload: only include fields the user actually typed.
    const payload: { google_maps_api_key?: string; openweathermap_api_key?: string } = {};

    if (form.google_maps_api_key !== '') {
      payload.google_maps_api_key = form.google_maps_api_key;
    }

    if (form.openweathermap_api_key !== '') {
      payload.openweathermap_api_key = form.openweathermap_api_key;
    }

    updateApiKeys(payload)
      .then((cfg) => {
        setHasGoogleMaps(cfg.google_maps_api_key === '***');
        setHasOpenWeather(cfg.openweathermap_api_key === '***');
        setForm(EMPTY);
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2000);
      })
      .catch((e: Error) => setError(e.message || 'Save failed'))
      .finally(() => setSaving(false));
  }

  return (
    <Card>
      <CardHeader
        title="API Keys"
        description="Runtime API keys for upstream services. Stored in the cuopt-backend's instance_settings table; takes effect immediately without a redeploy."
        icon={<KeyRound className="w-4 h-4" />}
      />
      <CardContent>
        {error && (
          <div className="mb-3 px-3 py-2 text-sm rounded-md bg-red-900/30 border border-red-700/50 text-red-200">
            {error}
          </div>
        )}
        {status === 'saved' && (
          <div className="mb-3 px-3 py-2 text-sm rounded-md bg-emerald-900/30 border border-emerald-700/50 text-emerald-200">
            Saved.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-medium text-gray-300 mb-1">
              Google Maps API key
            </span>
            <TextInput
              type="password"
              placeholder={hasGoogleMaps ? '*** (set — leave blank to keep)' : '(not configured)'}
              value={form.google_maps_api_key}
              onChange={(v) => setForm((f) => ({ ...f, google_maps_api_key: v }))}
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-gray-300 mb-1">
              OpenWeatherMap API key
            </span>
            <TextInput
              type="password"
              placeholder={hasOpenWeather ? '*** (set — leave blank to keep)' : '(not configured)'}
              value={form.openweathermap_api_key}
              onChange={(v) => setForm((f) => ({ ...f, openweathermap_api_key: v }))}
            />
          </label>
          <p className="text-xs text-gray-400">
            Leave blank to keep the current value. Submit an empty string explicitly (just spaces)
            to clear — the backend treats an empty string as &quot;remove&quot;.
          </p>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              loading={saving}
              disabled={
                saving || (form.google_maps_api_key === '' && form.openweathermap_api_key === '')
              }
            >
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default ApiKeysPanel;
