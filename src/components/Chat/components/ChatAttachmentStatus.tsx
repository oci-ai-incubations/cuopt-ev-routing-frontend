import { clsx } from 'clsx';
import { AlertTriangle, X, FileText } from 'lucide-react';

import type { Stop } from '@/types';

interface ChatAttachmentStatusProps {
  attachedFile: { name: string; stops: Stop[] } | null;
  fileError: string | null;
  onClearError: () => void;
  onRemoveFile: () => void;
}

export function ChatAttachmentStatus({
  attachedFile,
  fileError,
  onClearError,
  onRemoveFile,
}: ChatAttachmentStatusProps) {
  if (!attachedFile && !fileError) return null;

  return (
    <div className="px-4 pt-3">
      {fileError && (
        <div
          className={clsx(
            'flex items-center gap-2 text-red-400 text-sm',
            'bg-red-500/10 px-3 py-2 rounded-lg'
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{fileError}</span>
          <button onClick={onClearError} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {attachedFile && (
        <div
          className={clsx(
            'flex items-center gap-2 text-[#C74634] text-sm',
            'bg-[#C74634]/10 px-3 py-2 rounded-lg'
          )}
        >
          <FileText className="w-4 h-4" />
          <span>{attachedFile.name}</span>
          <span className="text-gray-400">({attachedFile.stops.length} stops)</span>
          <button onClick={onRemoveFile} className="ml-auto text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
