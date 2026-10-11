import React, { useState, useEffect } from 'react';
import {
  Grid3X3,
  Search,
  Zap,
  Settings,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { SudokuStudio } from './components/SudokuStudio.tsx';
import { WordSearchStudio } from './components/WordSearchStudio.tsx';
import { DailyBundle } from './components/DailyBundle.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { getStoredSettings } from './services/githubApi.ts';

type ActiveTab = 'sudoku' | 'word-search' | 'daily' | 'settings';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('sudoku');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  const checkTokenStatus = () => {
    const { token } = getStoredSettings();
    setHasToken(Boolean(token && token.trim().length > 0));
  };

  useEffect(() => {
    checkTokenStatus();
  }, []);

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'settings') {
      setIsSettingsOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 flex flex-col font-sans">
      {/* Top App Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 safe-top">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-950 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              P
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-gray-950 leading-tight">
                Pen to Paper
              </h1>
              <p className="text-[10px] text-gray-400 font-medium">reMarkable Puzzle Studio</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className={`px-2 py-1 rounded-full text-[11px] font-semibold flex items-center space-x-1 transition-all ${
                hasToken
                  ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 animate-pulse'
              }`}
            >
              {hasToken ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Ready</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                  <span>Setup Token</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'sudoku' && (
          <SudokuStudio onOpenSettings={() => setIsSettingsOpen(true)} />
        )}
        {activeTab === 'word-search' && (
          <WordSearchStudio onOpenSettings={() => setIsSettingsOpen(true)} />
        )}
        {activeTab === 'daily' && (
          <DailyBundle onOpenSettings={() => setIsSettingsOpen(true)} />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={checkTokenStatus}
      />

      {/* Bottom Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 safe-bottom">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
          <button
            type="button"
            onClick={() => handleTabChange('sudoku')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
              activeTab === 'sudoku'
                ? 'text-gray-950 font-bold'
                : 'text-gray-400 hover:text-gray-600 font-medium'
            }`}
          >
            <Grid3X3 className={`w-5 h-5 ${activeTab === 'sudoku' ? 'stroke-[2.4]' : ''}`} />
            <span className="text-[10px] mt-1">Sudoku</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('word-search')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
              activeTab === 'word-search'
                ? 'text-gray-950 font-bold'
                : 'text-gray-400 hover:text-gray-600 font-medium'
            }`}
          >
            <Search className={`w-5 h-5 ${activeTab === 'word-search' ? 'stroke-[2.4]' : ''}`} />
            <span className="text-[10px] mt-1">Word Search</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('daily')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
              activeTab === 'daily'
                ? 'text-gray-950 font-bold'
                : 'text-gray-400 hover:text-gray-600 font-medium'
            }`}
          >
            <Zap className={`w-5 h-5 ${activeTab === 'daily' ? 'stroke-[2.4] text-amber-500 fill-amber-500' : ''}`} />
            <span className="text-[10px] mt-1">Daily Pack</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('settings')}
            className="flex-1 flex flex-col items-center justify-center py-1 transition-colors text-gray-400 hover:text-gray-600 font-medium"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] mt-1">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
