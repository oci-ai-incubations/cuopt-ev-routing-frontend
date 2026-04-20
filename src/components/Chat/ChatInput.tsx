import { useState, useRef, type KeyboardEvent, type ChangeEvent } from 'react';

import { useChatStore } from '@/store';

import { ChatAttachmentStatus } from './components/ChatAttachmentStatus';
import { ChatComposer } from './components/ChatComposer';
import { ChatSettingsPanel } from './components/ChatSettingsPanel';
import { parseCSVToStops } from './helpers/chatInputUtils';
import { useAvailableModels } from './hooks/useAvailableModels';

import type { Stop } from '@/types';

interface ChatInputProps {
  onSend: (message: string, attachedStops?: Stop[]) => void;
  isProcessing: boolean;
}

export function ChatInput({ onSend, isProcessing }: ChatInputProps) {
  const { inputMessage, setInputMessage, config, setModel } = useChatStore();
  const [showSettings, setShowSettings] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; stops: Stop[] } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_TEXTAREA_HEIGHT = 150;

  const { models, modelsLoading } = useAvailableModels({
    currentModel: config.model,
    onModelChange: setModel,
  });

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setFileError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const stops = parseCSVToStops(content);

        if (stops.length === 0) {
          setFileError('No valid stops found in CSV');
          return;
        }

        setAttachedFile({ name: file.name, stops });
        setFileError(null);
      } catch (err) {
        setFileError(err instanceof Error ? err.message : 'Failed to parse CSV');
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setFileError(null);
  };

  const handleSend = () => {
    if (inputMessage.trim() && !isProcessing) {
      onSend(inputMessage.trim(), attachedFile?.stops);
      setInputMessage('');
      setAttachedFile(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    const nextHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    resizeTextarea(e.target);
  };

  return (
    <div className="border-t border-dark-border bg-dark-card">
      <ChatSettingsPanel
        isVisible={showSettings}
        model={config.model}
        models={models}
        modelsLoading={modelsLoading}
        onModelChange={setModel}
      />
      <ChatAttachmentStatus
        attachedFile={attachedFile}
        fileError={fileError}
        onClearError={() => setFileError(null)}
        onRemoveFile={handleRemoveFile}
      />
      <ChatComposer
        textareaRef={textareaRef}
        fileInputRef={fileInputRef}
        inputMessage={inputMessage}
        isProcessing={isProcessing}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onSend={handleSend}
        onFileUpload={handleFileUpload}
        onOpenFileDialog={() => fileInputRef.current?.click()}
        onToggleSettings={() => setShowSettings((prev) => !prev)}
      />
    </div>
  );
}
