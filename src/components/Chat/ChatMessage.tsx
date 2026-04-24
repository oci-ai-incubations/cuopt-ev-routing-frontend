import { clsx } from 'clsx';
import { User, Bot, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';

import { Card } from '@/components/shared/Card';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { formatTimestamp } from '@/utils';

import { CuOptResultCard } from './CuOptResultCard';

import type { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isUser = message.role === 'user';

  const renderedContent = useMemo(() => {
    if (isUser) return <p className="whitespace-pre-wrap">{message.content}</p>;
    return <MarkdownRenderer content={message.content} />;
  }, [message.content, isUser]);

  return (
    <div className={clsx('flex gap-3 animate-fade-in', isUser ? 'flex-row-reverse' : '')}>
      <div className={clsx('shrink-0 w-8 h-8 rounded-full flex items-center justify-center', isUser ? 'bg-navy' : 'bg-[#C74634]/20')}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-[#C74634]" />}
      </div>

      <div className={clsx('flex-1 max-w-[80%]', isUser ? 'text-right' : '')}>
        <div className={clsx(
          'inline-block text-left rounded-2xl px-4 py-3',
          isUser ? 'bg-navy text-white rounded-tr-none' : 'bg-dark-card text-gray-200 rounded-tl-none border border-dark-border'
        )}>
          {renderedContent}
          {isStreaming && <span className="inline-block w-2 h-4 bg-[#C74634] ml-1 animate-pulse" />}
        </div>

        {message.metadata?.cuoptResponse && (
          <div className="mt-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-sky-400 hover:underline"
            >
              {showDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              View Route Result
            </button>
            {showDetails && (
              <Card variant="bordered" className="mt-2" padding="sm">
                <CuOptResultCard result={message.metadata.cuoptResponse} />
              </Card>
            )}
          </div>
        )}

        <div className={clsx('mt-1 text-xs text-gray-500', isUser ? 'text-right' : '')}>
          {formatTimestamp(message.timestamp)}
          {message.metadata?.model && <span className="ml-2 text-gray-600">via {message.metadata.model}</span>}
        </div>
      </div>
    </div>
  );
}
