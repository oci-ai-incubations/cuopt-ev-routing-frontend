import { useEffect, useState } from 'react';

import { genaiClient } from '@/api';

import type { ModelId, ModelInfo } from '@/types';

interface UseAvailableModelsParams {
  currentModel?: string;
  onModelChange: (model: ModelId) => void;
}

const MOCK_MODELS: ModelInfo[] = [
  {
    id: 'gpt-4o-mini',
    object: 'model',
    created: 0,
    owned_by: 'OPENAI',
    custom_metadata: {
      model_type: 'chat',
      provider_id: 'openai',
      provider_resource_id: 'gpt-4o-mini',
    },
  },
  {
    id: 'gpt-4.1',
    object: 'model',
    created: 0,
    owned_by: 'OPENAI',
    custom_metadata: {
      model_type: 'chat',
      provider_id: 'openai',
      provider_resource_id: 'gpt-4.1',
    },
  },
  {
    id: 'claude-3-5-sonnet',
    object: 'model',
    created: 0,
    owned_by: 'ANTHROPIC',
    custom_metadata: {
      model_type: 'chat',
      provider_id: 'anthropic',
      provider_resource_id: 'claude-3-5-sonnet',
    },
  },
];

export function useAvailableModels({ currentModel, onModelChange }: UseAvailableModelsParams) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setModelsLoading(true);

    genaiClient
      .fetchModels()
      .then((fetched) => {
        if (cancelled) return;

        const resolvedModels = fetched.length > 0 ? fetched : MOCK_MODELS;
        setModels(resolvedModels);

        if (
          resolvedModels.length > 0 &&
          (!currentModel || !resolvedModels.find((model) => model.id === currentModel))
        ) {
          onModelChange(resolvedModels[0].id);
        }
      })
      .catch(() => {
        if (cancelled) return;

        setModels(MOCK_MODELS);
        if (!currentModel || !MOCK_MODELS.find((model) => model.id === currentModel)) {
          onModelChange(MOCK_MODELS[0].id);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setModelsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { models, modelsLoading };
}
