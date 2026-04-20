import { clsx } from 'clsx';

function processInlineFormatting(line: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
    const codeMatch = remaining.match(/`([^`]+)`/);
    const metricMatch = remaining.match(/(\d+(?:\.\d+)?)\s*(km|m|h|min|s|%|stops|vehicles?|routes?)/i);

    const matches = [
      { type: 'bold', match: boldMatch, index: boldMatch?.index ?? Infinity },
      { type: 'italic', match: italicMatch, index: italicMatch?.index ?? Infinity },
      { type: 'code', match: codeMatch, index: codeMatch?.index ?? Infinity },
      { type: 'metric', match: metricMatch, index: metricMatch?.index ?? Infinity },
    ].sort((a, b) => a.index - b.index);

    const firstMatch = matches.find(m => m.match);

    if (!firstMatch || firstMatch.index === Infinity) {
      parts.push(remaining);
      break;
    }

    if (firstMatch.index > 0) {
      parts.push(remaining.slice(0, firstMatch.index));
    }

    const match = firstMatch.match!;
    switch (firstMatch.type) {
      case 'bold':
        parts.push(<strong key={key++} className="font-semibold text-white">{match[1]}</strong>);
        remaining = remaining.slice(firstMatch.index + match[0].length);
        break;
      case 'italic':
        parts.push(<em key={key++} className="italic text-gray-300">{match[1]}</em>);
        remaining = remaining.slice(firstMatch.index + match[0].length);
        break;
      case 'code':
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 bg-dark-bg rounded text-[#C74634] font-mono text-sm">
            {match[1]}
          </code>
        );
        remaining = remaining.slice(firstMatch.index + match[0].length);
        break;
      case 'metric':
        parts.push(
          <span key={key++} className="font-semibold text-[#C74634]">
            {match[1]} {match[2]}
          </span>
        );
        remaining = remaining.slice(firstMatch.index + match[0].length);
        break;
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' = 'ul';

  const flushList = () => {
    if (listItems.length > 0) {
      const ListTag = listType === 'ol' ? 'ol' : 'ul';
      elements.push(
        <ListTag
          key={elements.length}
          className={clsx('my-2 space-y-1', listType === 'ol' ? 'list-decimal list-inside' : 'list-disc list-inside')}
        >
          {listItems.map((item, idx) => (
            <li key={idx} className="text-gray-300">{processInlineFormatting(item)}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, idx) => {
    if (line.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={idx} className="font-semibold text-white mt-3 mb-1 text-sm">{processInlineFormatting(line.slice(4))}</h3>);
      return;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={idx} className="font-bold text-white mt-3 mb-2">{processInlineFormatting(line.slice(3))}</h2>);
      return;
    }
    if (line.match(/^[-*•]\s+/)) {
      if (!inList || listType !== 'ul') { flushList(); inList = true; listType = 'ul'; }
      listItems.push(line.replace(/^[-*•]\s+/, ''));
      return;
    }
    if (line.match(/^\d+\.\s+/)) {
      if (!inList || listType !== 'ol') { flushList(); inList = true; listType = 'ol'; }
      listItems.push(line.replace(/^\d+\.\s+/, ''));
      return;
    }
    if (line.trim() === '') {
      flushList();
      elements.push(<div key={idx} className="h-2" />);
      return;
    }
    flushList();
    elements.push(<p key={idx} className="text-gray-300">{processInlineFormatting(line)}</p>);
  });

  flushList();
  return elements;
}

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return <div className="space-y-1">{parseMarkdown(content)}</div>;
}
