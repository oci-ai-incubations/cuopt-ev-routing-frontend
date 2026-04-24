import { clsx } from 'clsx';
import { LogOut, Moon, Sun, User } from 'lucide-react';

import { Modal } from '@/components/shared/Modal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string | null;
  mapTheme: string;
  onToggleMapTheme: () => void;
  onLogoutClick: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  mapTheme,
  onToggleMapTheme,
  onLogoutClick,
}: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
      <div className="space-y-6">
        <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-oracle-red/20 flex items-center justify-center">
              <User className="w-5 h-5 text-oracle-red" />
            </div>
            <div>
              <div className="font-medium text-white">{currentUser || 'User'}</div>
              <div className="text-xs text-gray-400">Logged in</div>
            </div>
          </div>
          <button
            onClick={() => { onClose(); onLogoutClick(); }}
            className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <div className="border-t border-dark-border" />

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-white">Map Theme</div>
            <div className="text-sm text-gray-400">Switch between dark and light map tiles</div>
          </div>
          <button
            onClick={onToggleMapTheme}
            className={clsx(
              'px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
              mapTheme === 'dark' ? 'bg-gray-700 text-white' : 'bg-yellow-100 text-yellow-800'
            )}
          >
            {mapTheme === 'dark' ? (
              <><Moon className="w-4 h-4" /> Dark</>
            ) : (
              <><Sun className="w-4 h-4" /> Light</>
            )}
          </button>
        </div>

        <div className="border-t border-dark-border" />

        <div>
          <div className="font-medium text-white mb-3">API Configuration</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 px-3 bg-dark-bg rounded-lg">
              <span className="text-gray-400">cuOPT Endpoint</span>
              <span className="text-gray-300 font-mono text-xs">cuopt-2-cuopt.*.nip.io</span>
            </div>
            <div className="flex justify-between py-2 px-3 bg-dark-bg rounded-lg">
              <span className="text-gray-400">OCI GenAI</span>
              <span className="text-gray-300 font-mono text-xs">us-phoenix-1</span>
            </div>
            <div className="flex justify-between py-2 px-3 bg-dark-bg rounded-lg">
              <span className="text-gray-400">Weather API</span>
              <span className="text-gray-300 font-mono text-xs">OpenWeatherMap</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-dark-border text-center text-xs text-gray-500">
          OCI Route Optimizer v1.0.0 | Powered by NVIDIA cuOPT NIM
        </div>
      </div>
    </Modal>
  );
}
