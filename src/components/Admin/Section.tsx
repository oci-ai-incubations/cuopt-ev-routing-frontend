import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function Section({ title, icon, children, defaultExpanded = true }: SectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-dark-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-oracle-red/10 flex items-center justify-center">{icon}</div>
          <span className="font-medium text-white">{title}</span>
        </div>
        {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </button>
      {expanded && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}
