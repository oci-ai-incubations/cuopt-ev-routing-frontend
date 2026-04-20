import { Code } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';

interface ChatDebugPanelProps {
  lastGenAIPrompt: string | null;
  lastCuOptRequest: object | null;
  lastCuOptResponse: object | null;
}

function JsonCard({ title, badge, data }: { title: string; badge: React.ReactNode; data: object | null }) {
  return (
    <Card variant="bordered" padding="sm">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {badge}
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-dark-hover"
          >
            Copy
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="text-xs text-gray-300 overflow-auto font-mono bg-dark-bg p-2 rounded max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

export function ChatDebugPanel({ lastGenAIPrompt, lastCuOptRequest, lastCuOptResponse }: ChatDebugPanelProps) {
  return (
    <div className="w-96 border-l border-dark-border bg-dark-bg overflow-y-auto">
      <div className="p-4 border-b border-dark-border">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Code className="w-4 h-4 text-[#C74634]" />
          Debug Panel
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {lastGenAIPrompt && (
          <Card variant="bordered" padding="sm">
            <CardHeader><CardTitle className="text-sm">Interpretation</CardTitle></CardHeader>
            <CardContent><p className="text-xs text-gray-400">{lastGenAIPrompt}</p></CardContent>
          </Card>
        )}
        {lastCuOptRequest && (
          <JsonCard title="cuOPT Request" badge={<Badge variant="info">JSON</Badge>} data={lastCuOptRequest} />
        )}
        {lastCuOptResponse && (
          <JsonCard title="cuOPT Response" badge={<Badge variant="success">Result</Badge>} data={lastCuOptResponse} />
        )}
      </div>
    </div>
  );
}
