/**
 * Feature Flags panel — admin-only.
 *
 * Toggle runtime features (GenAI chat, weather, SSO) without redeploying.
 * Each toggle PATCHes /api/admin/config/features with the one changed field;
 * the cuopt-backend's runtime routes 404 immediately when the matching flag
 * goes false.
 */

import { ToggleLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchInstanceConfig, updateFeatures } from '@/api/admin';
import {
  Card,
  CardContent,
  CardHeader,
  PanelLoading,
  Toggle,
} from '@/components/Admin/auth/_primitives';
import type { FeatureFlagsUpdate, InstanceConfig } from '@/types/admin';

type FlagKey = keyof FeatureFlagsUpdate;

const FLAGS: Array<{ key: FlagKey; label: string; description: string }> = [
  {
    key: 'genai_chat_enabled',
    label: 'GenAI chat',
    description: 'Enables /api/genai/* and the LLM-powered route explanation UI.',
  },
  {
    key: 'weather_enabled',
    label: 'Weather',
    description: 'Enables /api/weather/* and the weather-aware routing UI.',
  },
  {
    key: 'sso_enabled',
    label: 'SSO',
    description: 'Shows SSO provider buttons on the login screen.',
  },
];

export function FeatureFlagsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<InstanceConfig | null>(null);
  const [pendingKey, setPendingKey] = useState<FlagKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchInstanceConfig()
      .then((cfg) => !cancelled && setConfig(cfg))
      .catch((e: Error) => !cancelled && setError(e.message || 'Failed to load config'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PanelLoading />;
  if (!config) {
    return (
      <div className="px-3 py-2 text-sm rounded-md bg-red-900/30 border border-red-700/50 text-red-200">
        {error ?? 'No config'}
      </div>
    );
  }

  function handleToggle(key: FlagKey, next: boolean) {
    setPendingKey(key);
    setError(null);
    updateFeatures({ [key]: next })
      .then((cfg) => setConfig(cfg))
      .catch((e: Error) => setError(e.message || 'Update failed'))
      .finally(() => setPendingKey(null));
  }

  return (
    <Card>
      <CardHeader
        title="Feature flags"
        description="Toggle optional capabilities at runtime. Takes effect immediately without a redeploy."
        icon={<ToggleLeft className="w-4 h-4" />}
      />
      <CardContent>
        {error && (
          <div className="mb-3 px-3 py-2 text-sm rounded-md bg-red-900/30 border border-red-700/50 text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {FLAGS.map((f) => (
            <div
              key={f.key}
              className="pb-4 border-b border-dark-border last:border-b-0 last:pb-0"
            >
              <Toggle
                checked={config[f.key]}
                onChange={(v) => handleToggle(f.key, v)}
                disabled={pendingKey !== null}
                label={f.label}
                description={f.description}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default FeatureFlagsPanel;
