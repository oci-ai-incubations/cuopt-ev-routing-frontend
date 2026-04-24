import { Select } from '@/components/shared/Select';

import type { ModelId, ModelInfo } from '@/types';

interface ChatSettingsPanelProps {
  isVisible: boolean;
  model: string;
  models: ModelInfo[];
  modelsLoading: boolean;
  onModelChange: (model: ModelId) => void;
}

export function ChatSettingsPanel({
  isVisible,
  model,
  models,
  modelsLoading,
  onModelChange,
}: ChatSettingsPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="p-4 border-b border-dark-border space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <Select
            label="Model"
            options={
              modelsLoading
                ? [{ value: '', label: 'Loading models...' }]
                : models.map((item) => ({ value: item.id, label: item.id }))
            }
            value={model}
            onChange={(event) => onModelChange(event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
