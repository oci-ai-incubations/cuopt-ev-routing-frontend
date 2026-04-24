import { clsx } from 'clsx';
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Route,
  Zap,
  BarChart3,
  HelpCircle,
} from 'lucide-react';

type AppMode = 'dashboard' | 'chat' | 'admin';

interface NavItem {
  id: AppMode;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Route Optimizer',
    icon: <LayoutDashboard className="w-5 h-5" />,
    description: 'Full optimization dashboard',
  },
  {
    id: 'chat',
    label: 'AI Assistant',
    icon: <MessageSquare className="w-5 h-5" />,
    description: 'Natural language interface',
  },
  {
    id: 'admin',
    label: 'Configuration',
    icon: <Settings className="w-5 h-5" />,
    description: 'Regional & scenario settings',
  },
];

interface AppSidebarProps {
  mode: AppMode;
  collapsed: boolean;
  onSetMode: (mode: AppMode) => void;
  onToggleCollapse: () => void;
  onShowHelp: () => void;
  onShowSettings: () => void;
}

export function AppSidebar({
  mode,
  collapsed,
  onSetMode,
  onToggleCollapse,
  onShowHelp,
  onShowSettings,
}: AppSidebarProps) {
  return (
    <aside
      className={clsx(
        'flex flex-col border-r border-dark-border bg-dark-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center gap-3 px-4 border-b border-dark-border">
        <div className="w-8 h-8 rounded-lg bg-oracle-red flex items-center justify-center shrink-0">
          <Route className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-white text-sm whitespace-nowrap">cuOPT</h1>
            <p className="text-xs text-gray-500 whitespace-nowrap">Route Optimizer</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSetMode(item.id)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
              mode === item.id
                ? 'bg-oracle-red/10 text-oracle-red border border-oracle-red/30'
                : 'text-gray-400 hover:bg-dark-hover hover:text-white'
            )}
          >
            {item.icon}
            {!collapsed && (
              <div className="text-left overflow-hidden">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-gray-500 truncate">{item.description}</div>
              </div>
            )}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-dark-border space-y-3">
          <div className="text-xs font-medium text-gray-500 uppercase">Quick Stats</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-dark-bg rounded-lg p-2">
              <div className="flex items-center gap-1 text-oci-blue mb-1">
                <Zap className="w-3 h-3" />
                <span className="text-xs">OKE</span>
              </div>
              <div className="text-sm font-semibold">GPU</div>
            </div>
            <div className="bg-dark-bg rounded-lg p-2">
              <div className="flex items-center gap-1 text-oracle-red mb-1">
                <BarChart3 className="w-3 h-3" />
                <span className="text-xs">NIM</span>
              </div>
              <div className="text-sm font-semibold">cuOPT</div>
            </div>
          </div>
        </div>
      )}

      <div className="p-3 border-t border-dark-border">
        <div className="flex items-center justify-between">
          <button
            onClick={onToggleCollapse}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          {!collapsed && (
            <div className="flex gap-1">
              <button
                onClick={onShowHelp}
                className="p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors"
                title="Help & Documentation"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={onShowSettings}
                className="p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
