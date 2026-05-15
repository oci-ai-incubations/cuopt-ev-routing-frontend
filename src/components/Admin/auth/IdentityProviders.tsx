/**
 * Admin → Identity Providers
 *
 * CRUD on OIDC/SAML providers + claim-to-role mappings.
 * Uses /auth/providers, /auth/providers/{id}/mappings.
 */

import { ChevronDown, ChevronRight, KeyRound, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  createClaimMapping,
  createProvider,
  deleteClaimMapping,
  listClaimMappings,
  listProviders,
  updateProvider,
} from '@/api/admin';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Modal,
  PanelLoading,
  TextInput,
  Toggle,
} from '@/components/Admin/auth/_primitives';

import type { ClaimMapping, IdentityProvider } from '@/types/admin';

const TYPE_VARIANT: Record<string, 'info' | 'oracle' | 'default'> = {
  oidc: 'info',
  saml: 'oracle',
};

export function IdentityProviders() {
  const [providers, setProviders] = useState<IdentityProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [mappingsCache, setMappingsCache] = useState<Record<number, ClaimMapping[]>>({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<'oidc' | 'saml'>('oidc');
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newConfig, setNewConfig] = useState('{}');
  const [creating, setCreating] = useState(false);

  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingProviderId, setMappingProviderId] = useState<number | null>(null);
  const [mappingClaimKey, setMappingClaimKey] = useState('');
  const [mappingClaimValue, setMappingClaimValue] = useState('');
  const [mappingTargetRole, setMappingTargetRole] = useState('');
  const [mappingIsRegex, setMappingIsRegex] = useState(false);
  const [creatingMapping, setCreatingMapping] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setProviders(await listProviders());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const refreshMappings = async (providerId: number) => {
    const m = await listClaimMappings(providerId);
    setMappingsCache((prev) => ({ ...prev, [providerId]: m }));
  };

  const toggleExpanded = async (providerId: number) => {
    if (expandedId === providerId) {
      setExpandedId(null);
    } else {
      setExpandedId(providerId);
      if (!mappingsCache[providerId]) await refreshMappings(providerId);
    }
  };

  const toggleActive = async (provider: IdentityProvider) => {
    setTogglingId(provider.id);
    try {
      const updated = await updateProvider(provider.id, { is_active: !provider.is_active });
      setProviders((prev) => prev.map((p) => (p.id === provider.id ? updated : p)));
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateProvider = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    let config: Record<string, unknown>;
    try {
      config = JSON.parse(newConfig) as Record<string, unknown>;
    } catch {
      return;
    }
    setCreating(true);
    try {
      await createProvider({ type: newType, name: newName, slug: newSlug, config });
      setNewName('');
      setNewSlug('');
      setNewConfig('{}');
      setNewType('oidc');
      setShowAddModal(false);
      await refresh();
    } finally {
      setCreating(false);
    }
  };

  const handleCreateMapping = async () => {
    if (!mappingProviderId || !mappingClaimKey.trim() || !mappingTargetRole.trim()) return;
    setCreatingMapping(true);
    try {
      await createClaimMapping(mappingProviderId, {
        claim_key: mappingClaimKey,
        claim_value_pattern: mappingClaimValue,
        target_role: mappingTargetRole,
        is_regex: mappingIsRegex,
      });
      setMappingClaimKey('');
      setMappingClaimValue('');
      setMappingTargetRole('');
      setMappingIsRegex(false);
      setShowMappingModal(false);
      await refreshMappings(mappingProviderId);
    } finally {
      setCreatingMapping(false);
    }
  };

  const handleDeleteMapping = async (providerId: number, mappingId: number) => {
    await deleteClaimMapping(providerId, mappingId);
    await refreshMappings(providerId);
  };

  if (loading) return <PanelLoading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Identity Providers</h2>
        <p className="text-sm text-gray-400 mt-1">
          Configure SSO identity providers and claim-to-role mappings
        </p>
      </div>

      <Card>
        <CardHeader
          title={`Providers (${providers.length})`}
          description="OIDC and SAML providers for single sign-on authentication"
          icon={<KeyRound className="w-4 h-4 text-oracle-red" />}
        />
        <CardContent className="space-y-3">
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Provider
            </Button>
          </div>

          {providers.map((provider) => {
            const mappings = mappingsCache[provider.id] ?? [];
            const expanded = expandedId === provider.id;
            return (
              <div
                key={provider.id}
                className="rounded-lg border border-dark-border overflow-hidden"
              >
                <div
                  data-testid={`provider-row-${provider.id}`}
                  className="flex items-center justify-between p-3 bg-dark-bg cursor-pointer hover:bg-dark-hover"
                  onClick={() => void toggleExpanded(provider.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {expanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-white">{provider.name}</span>
                    <Badge variant={TYPE_VARIANT[provider.type] ?? 'default'}>
                      {provider.type.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-400">/{provider.slug}</span>
                  </div>
                  <div
                    className="flex items-center gap-3 ml-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Toggle
                      checked={provider.is_active}
                      onChange={() => void toggleActive(provider)}
                      disabled={togglingId === provider.id}
                      label={provider.is_active ? 'Active' : 'Disabled'}
                    />
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-dark-border p-3 bg-dark-bg/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                        Claim Mappings
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setMappingProviderId(provider.id);
                          setShowMappingModal(true);
                        }}
                        icon={<Plus className="w-3.5 h-3.5" />}
                      >
                        Add Mapping
                      </Button>
                    </div>

                    {mappings.length > 0 ? (
                      <div className="space-y-2">
                        {mappings.map((mapping) => (
                          <div
                            key={mapping.id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-dark-bg border border-dark-border"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xs text-white font-mono">
                                {mapping.claim_key}
                              </span>
                              <span className="text-xs text-gray-400">=</span>
                              <span className="text-xs text-white font-mono truncate">
                                {mapping.claim_value_pattern}
                              </span>
                              {mapping.is_regex && <Badge variant="warning">regex</Badge>}
                              <span className="text-xs text-gray-400">→</span>
                              <Badge variant="info">{mapping.target_role}</Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="Delete mapping"
                              onClick={() => void handleDeleteMapping(provider.id, mapping.id)}
                              icon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-2">
                        No claim mappings configured
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {providers.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No identity providers configured
            </p>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Identity Provider"
        description="Configure a new SSO identity provider"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'oidc' | 'saml')}
              className="w-full bg-dark-bg border border-dark-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-oracle-red"
            >
              <option value="oidc">OIDC</option>
              <option value="saml">SAML</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Name</label>
            <TextInput value={newName} onChange={setNewName} placeholder="e.g. Okta Production" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Slug</label>
            <TextInput value={newSlug} onChange={setNewSlug} placeholder="e.g. okta-prod" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Configuration (JSON)
            </label>
            <textarea
              value={newConfig}
              onChange={(e) => setNewConfig(e.target.value)}
              rows={5}
              className="w-full bg-dark-bg border border-dark-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-oracle-red font-mono"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleCreateProvider()}
              loading={creating}
              disabled={!newName.trim() || !newSlug.trim()}
            >
              Add Provider
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showMappingModal}
        onClose={() => setShowMappingModal(false)}
        title="Add Claim Mapping"
        description="Map an identity provider claim to a role"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Claim Key</label>
            <TextInput
              value={mappingClaimKey}
              onChange={setMappingClaimKey}
              placeholder="e.g. groups"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Claim Value Pattern
            </label>
            <TextInput
              value={mappingClaimValue}
              onChange={setMappingClaimValue}
              placeholder="e.g. admin-group"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Target Role</label>
            <TextInput
              value={mappingTargetRole}
              onChange={setMappingTargetRole}
              placeholder="e.g. admin"
            />
          </div>
          <Toggle
            label="Regex Pattern"
            description="Treat the claim value pattern as a regular expression"
            checked={mappingIsRegex}
            onChange={setMappingIsRegex}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowMappingModal(false)}
              disabled={creatingMapping}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleCreateMapping()}
              loading={creatingMapping}
              disabled={!mappingClaimKey.trim() || !mappingTargetRole.trim()}
            >
              Add Mapping
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default IdentityProviders;
