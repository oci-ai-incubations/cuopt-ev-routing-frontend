type AppMode = 'dashboard' | 'chat' | 'admin';

interface AppHeaderProps {
  mode: AppMode;
  countryCode: string;
  activeScenario: string;
}

const TITLES: Record<AppMode, string> = {
  dashboard: 'Route Optimizer Dashboard',
  chat: 'AI Chat Assistant',
  admin: 'Configuration Settings',
};

const SUBTITLES: Record<AppMode, string | null> = {
  dashboard: 'Configure and run route optimization with NVIDIA cuOPT',
  chat: 'Natural language route optimization powered by OCI GenAI',
  admin: null,
};

export function AppHeader({ mode, countryCode, activeScenario }: AppHeaderProps) {
  const subtitle =
    mode === 'admin'
      ? `Region: ${countryCode} | Scenario: ${activeScenario}`
      : SUBTITLES[mode];

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-dark-border bg-dark-card">
      <div>
        <h2 className="text-lg font-semibold">{TITLES[mode]}</h2>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-bg rounded-full">
          <div className="w-2 h-2 bg-oci-green rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">OCI Ready</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-nvidia-green font-semibold">NVIDIA cuOPT</span>
          <span className="text-gray-500">powered by</span>
          <span style={{ color: '#C74634' }} className="font-semibold">OCI</span>
        </div>
      </div>
    </header>
  );
}
