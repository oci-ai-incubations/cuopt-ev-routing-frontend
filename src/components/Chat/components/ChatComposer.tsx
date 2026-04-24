import { clsx } from 'clsx';
import { Send, Paperclip, Mic, Settings } from 'lucide-react';

import { Button } from '@/components/shared/Button';

import type { ChangeEvent, KeyboardEvent, RefObject } from 'react';

interface ChatComposerProps {
  textareaRef: RefObject<HTMLTextAreaElement>;
  fileInputRef: RefObject<HTMLInputElement>;
  inputMessage: string;
  isProcessing: boolean;
  onInput: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenFileDialog: () => void;
  onToggleSettings: () => void;
}

export function ChatComposer({
  textareaRef,
  fileInputRef,
  inputMessage,
  isProcessing,
  onInput,
  onKeyDown,
  onSend,
  onFileUpload,
  onOpenFileDialog,
  onToggleSettings,
}: ChatComposerProps) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileUpload}
          accept=".csv"
          className="hidden"
        />
        <button
          onClick={onOpenFileDialog}
          className={clsx(
            'shrink-0 p-2 text-gray-400 rounded-lg transition-colors',
            'hover:text-white hover:bg-dark-hover'
          )}
          title="Attach CSV file with stops"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={onInput}
            onKeyDown={onKeyDown}
            placeholder="Ask about route optimization..."
            rows={1}
            className={clsx(
              'w-full bg-dark-bg border border-dark-border rounded-xl',
              'px-4 py-3 pr-12 text-white placeholder-gray-500 resize-none overflow-y-hidden',
              'focus:outline-none focus:ring-2 focus:ring-[#C74634] focus:border-transparent'
            )}
            disabled={isProcessing}
          />
          <button
            onClick={onToggleSettings}
            className={clsx(
              'absolute right-3 top-1/2 -translate-y-1/2 p-1.5',
              'text-gray-400 hover:text-white rounded transition-colors'
            )}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <button
          className={clsx(
            'shrink-0 p-2 text-gray-400 rounded-lg transition-colors',
            'hover:text-white hover:bg-dark-hover'
          )}
        >
          <Mic className="w-5 h-5" />
        </button>

        <Button
          variant="primary"
          size="md"
          onClick={onSend}
          disabled={!inputMessage.trim() || isProcessing}
          isLoading={isProcessing}
          className="shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

    </div>
  );
}
