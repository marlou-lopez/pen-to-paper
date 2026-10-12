import React, { useEffect } from 'react';
import { X, Grid3X3, Search, Zap, Check } from 'lucide-react';

export type ActiveTab = 'sudoku' | 'word-search' | 'daily';

interface PuzzleOption {
  id: ActiveTab;
  title: string;
  badge?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PUZZLE_OPTIONS: PuzzleOption[] = [
  {
    id: 'sudoku',
    title: 'Sudoku Studio',
    description: 'Transcribe physical books or create custom grids',
    icon: Grid3X3,
  },
  {
    id: 'word-search',
    title: 'Word Search Studio',
    description: '15 curated offline themes or custom word lists',
    icon: Search,
  },
  {
    id: 'daily',
    title: 'Daily Pack',
    badge: '1-Tap',
    description: "Generate today's complete puzzle bundle to /Puzzles/Daily",
    icon: Zap,
  },
];

interface PuzzleSelectorModalProps {
  isOpen: boolean;
  activeTab: ActiveTab;
  onSelect: (tab: ActiveTab) => void;
  onClose: () => void;
}

export const PuzzleSelectorModal: React.FC<PuzzleSelectorModalProps> = ({
  isOpen,
  activeTab,
  onSelect,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="puzzle-selector-title"
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col p-5 space-y-4 max-h-[85vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h3 id="puzzle-selector-title" className="text-sm font-bold text-gray-950">Switch Puzzle Studio</h3>
            <p className="text-[11px] text-gray-500">Select a puzzle type to work with</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {PUZZLE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = activeTab === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onSelect(opt.id);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-gray-950 bg-gray-50 text-gray-950 shadow-sm ring-1 ring-gray-950'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold">{opt.title}</span>
                      {opt.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-100 text-amber-800 rounded-md">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{opt.description}</p>
                  </div>
                </div>

                {isSelected && <Check className="w-4 h-4 text-gray-950 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
