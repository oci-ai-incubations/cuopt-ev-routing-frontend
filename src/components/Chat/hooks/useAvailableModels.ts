import { useEffect, useState } from 'react';

import { genaiClient } from '@/api';

import type { ModelId, ModelInfo } from '@/types';

interface UseAvailableModelsParams {
  currentModel?: string;
  onModelChange: (model: ModelId) => void;
}

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

        setModels(fetched);

        if (
          fetched.length > 0 &&
          (!currentModel || !fetched.find((model) => model.id === currentModel))
        ) {
          onModelChange(fetched[0].id);
        }
      })
      .catch(() => {
        if (cancelled) return;

        setModels([]);
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
