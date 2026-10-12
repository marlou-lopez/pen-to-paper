import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Settings,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { SudokuStudio } from './components/SudokuStudio.tsx';
import { WordSearchStudio } from './components/WordSearchStudio.tsx';
import { DailyBundle } from './components/DailyBundle.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { PuzzleSelectorModal, ActiveTab } from './components/PuzzleSelectorModal.tsx';
import { getStoredSettings } from './services/githubApi.ts';

const TAB_TITLES: Record<ActiveTab, string> = {
  sudoku: '🧩 Sudoku Studio',
  'word-search': '🔍 Word Search',
  daily: '⚡ Daily Pack',
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('sudoku');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  const checkTokenStatus = () => {
    const { token } = getStoredSettings();
    setHasToken(Boolean(token && token.trim().length > 0));
  };

  useEffect(() => {
    checkTokenStatus();
  }, []);

  return (
    <div className="h-[100dvh] bg-[#F9FAFB] text-gray-900 flex flex-col font-sans overflow-hidden">
      {/* Top App Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 safe-top">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-gray-950 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              P
            </div>
            <button
              type="button"
              onClick={() => setIsSelectorOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-950 font-bold text-xs transition-colors cursor-pointer active:scale-95"
            >
              <span>{TAB_TITLES[activeTab]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>
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

      {/* Puzzle Selector Modal */}
      <PuzzleSelectorModal
        isOpen={isSelectorOpen}
        activeTab={activeTab}
        onSelect={setActiveTab}
        onClose={() => setIsSelectorOpen(false)}
      />
    </div>
  );
};

export default App;
