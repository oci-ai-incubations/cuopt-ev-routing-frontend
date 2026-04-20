import { MessageSquare, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface ChatHeaderProps {
  debugMode: boolean;
  onToggleDebug: () => void;
}

export function ChatHeader({ debugMode, onToggleDebug }: ChatHeaderProps) {
  return (
    <div className="border-b border-dark-border px-6 py-4 flex items-center justify-between bg-dark-card">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#C74634]/20 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-[#C74634]" />
        </div>
        <div>
          <h2 className="font-semibold text-white">cuOPT AI Assistant</h2>
          <p className="text-xs text-gray-400">Natural language route optimization</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        leftIcon={debugMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        onClick={onToggleDebug}
      >
        {debugMode ? 'Hide Debug' : 'Debug'}
      </Button>
    </div>
  );
}
