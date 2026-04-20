import { Sparkles } from 'lucide-react';
import { useConfigStore } from '@/store';
import { examplePrompts } from '@/data/benchmarkData';
import { generateDynamicPrompts } from '@/data/locationData';

interface ChatEmptyStateProps {
  onPromptClick: (prompt: string) => void;
}

export function ChatEmptyState({ onPromptClick }: ChatEmptyStateProps) {
  const { config: appConfig } = useConfigStore();
  const dynamicPrompts = generateDynamicPrompts(appConfig.countryCode, appConfig.cityId, appConfig.activeScenario);
  const prompts = dynamicPrompts.length > 0 ? dynamicPrompts : examplePrompts;
  const cityLabel = appConfig.cityId.charAt(0).toUpperCase() + appConfig.cityId.slice(1).replace('_', ' ');

  const quickTests = [
    { label: '50 Stops', prompt: prompts[0] },
    { label: '200 Stops', prompt: prompts[1] },
    { label: '500 Stops', prompt: prompts[2] },
    { label: 'Priority', prompt: prompts[3] },
    { label: 'National', prompt: prompts[4] },
    { label: appConfig.activeScenario === 'belron' ? 'Belron Jobs' : 'Regional', prompt: prompts[6] || prompts[5] },
  ].filter(item => item.prompt);

  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#C74634]/10 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-[#C74634]" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">How can I help you today?</h3>
      <p className="text-gray-400 max-w-md mb-8">
        Describe your routing problem in natural language, and I'll create an optimized solution using NVIDIA cuOPT.
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-2xl">
        {prompts.slice(0, 4).map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onPromptClick(prompt)}
            className="p-4 bg-dark-card border border-dark-border rounded-xl text-left hover:bg-dark-hover hover:border-[#C74634]/30 transition-all group"
          >
            <span className="text-sm text-gray-300 group-hover:text-white">{prompt}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-2">Location: {cityLabel}, {appConfig.countryCode}</p>

      <div className="mt-6 text-left max-w-2xl">
        <p className="text-xs text-gray-500 mb-2">Quick Tests ({cityLabel}):</p>
        <div className="flex flex-wrap gap-2">
          {quickTests.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onPromptClick(item.prompt)}
              className="px-3 py-1 text-xs bg-dark-bg border border-dark-border rounded-full text-gray-400 hover:text-[#C74634] hover:border-[#C74634]/50 transition-all"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
