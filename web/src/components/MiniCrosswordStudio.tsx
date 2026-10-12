import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  Eraser,
} from 'lucide-react';
import {
  getStoredSettings,
  dispatchWorkflow,
  pollWorkflowRun,
  WorkflowRun,
} from '../services/githubApi.ts';
import {
  CELL_CLUE_NUMBERS,
  PRESET_THEMES,
  SAMPLE_PUZZLES,
  createEmptyCrosswordGrid,
  isCrosswordSolved,
} from '../utils/crossword.ts';

export interface MiniCrosswordStudioProps {
  onOpenSettings: () => void;
}

export const MiniCrosswordStudio: React.FC<MiniCrosswordStudioProps> = ({ onOpenSettings }) => {
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>([0, 0]);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [sampleIndex, setSampleIndex] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<string>('Daily');
  const [customTheme, setCustomTheme] = useState<string>('');

  // Player grid and solution visibility (solutions hidden by default)
  const [userGrid, setUserGrid] = useState<string[][]>(() => createEmptyCrosswordGrid());
  const [showSolution, setShowSolution] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const [isBusy, setIsBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'idle' | 'running' | 'success' | 'error';
    text: string;
    detail?: string;
    runUrl?: string;
  }>({ type: 'idle', text: '' });

  const activeTheme = customTheme.trim() ? customTheme.trim() : selectedPreset;
  const currentPuzzle = SAMPLE_PUZZLES[sampleIndex];

  // Check if player solved the puzzle
  const isSolved = useMemo(() => {
    return isCrosswordSolved(userGrid, currentPuzzle.grid);
  }, [userGrid, currentPuzzle]);

  // Active clue computation
  const activeClue = useMemo(() => {
    if (!selectedCell) return currentPuzzle.acrossClues[0];
    const [r, c] = selectedCell;
    if (direction === 'across') {
      return currentPuzzle.acrossClues[r] || currentPuzzle.acrossClues[0];
    } else {
      return currentPuzzle.downClues[c] || currentPuzzle.downClues[0];
    }
  }, [selectedCell, direction, currentPuzzle]);

  const activeClueIndex = useMemo(() => {
    if (!selectedCell) return 0;
    const [r, c] = selectedCell;
    return direction === 'across' ? r : 5 + c;
  }, [selectedCell, direction]);

  const handlePrevClue = useCallback(() => {
    const nextIndex = (activeClueIndex - 1 + 10) % 10;
    if (nextIndex < 5) {
      setDirection('across');
      setSelectedCell([nextIndex, 0]);
    } else {
      setDirection('down');
      setSelectedCell([0, nextIndex - 5]);
    }
    hiddenInputRef.current?.focus();
  }, [activeClueIndex]);

  const handleNextClue = useCallback(() => {
    const nextIndex = (activeClueIndex + 1) % 10;
    if (nextIndex < 5) {
      setDirection('across');
      setSelectedCell([nextIndex, 0]);
    } else {
      setDirection('down');
      setSelectedCell([0, nextIndex - 5]);
    }
    hiddenInputRef.current?.focus();
  }, [activeClueIndex]);

  // Toggle direction or select cell
  const handleCellClick = (r: number, c: number) => {
    if (selectedCell && selectedCell[0] === r && selectedCell[1] === c) {
      setDirection((d) => (d === 'across' ? 'down' : 'across'));
    } else {
      setSelectedCell([r, c]);
    }
    hiddenInputRef.current?.focus();
  };

  const handleToggleDirection = useCallback(() => {
    setDirection((d) => (d === 'across' ? 'down' : 'across'));
    hiddenInputRef.current?.focus();
  }, []);

  const handleCycleSample = () => {
    setSampleIndex((prev) => (prev + 1) % SAMPLE_PUZZLES.length);
    setUserGrid(createEmptyCrosswordGrid());
    setShowSolution(false);
    setSelectedCell([0, 0]);
    hiddenInputRef.current?.focus();
  };

  const handleClearGrid = useCallback(() => {
    setUserGrid(createEmptyCrosswordGrid());
    setShowSolution(false);
    setSelectedCell([0, 0]);
    hiddenInputRef.current?.focus();
  }, []);

  const handleSelectPreset = (preset: string) => {
    setSelectedPreset(preset);
    setCustomTheme('');
  };

  // Character entry and auto-advance
  const handleInputCharacter = useCallback(
    (char: string) => {
      if (!selectedCell) return;
      const [r, c] = selectedCell;
      const upper = char.toUpperCase();
      if (!/^[A-Z]$/.test(upper)) return;

      setUserGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = upper;
        return next;
      });

      // Auto-advance cursor in current direction
      if (direction === 'across') {
        if (c < 4) {
          setSelectedCell([r, c + 1]);
        }
      } else {
        if (r < 4) {
          setSelectedCell([r + 1, c]);
        }
      }
    },
    [selectedCell, direction]
  );

  const handleBackspace = useCallback(() => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;

    setUserGrid((prev) => {
      const currentVal = prev[r]?.[c] || '';
      const next = prev.map((row) => [...row]);

      if (currentVal !== '') {
        next[r][c] = '';
        return next;
      }

      // If current cell was already empty, move backward and clear previous cell
      if (direction === 'across' && c > 0) {
        next[r][c - 1] = '';
        setSelectedCell([r, c - 1]);
      } else if (direction === 'down' && r > 0) {
        next[r - 1][c] = '';
        setSelectedCell([r - 1, c]);
      }
      return next;
    });
  }, [selectedCell, direction]);

  // Keyboard navigation & entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target !== hiddenInputRef.current &&
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggleDirection();
      } else if (e.key === 'ArrowRight' && selectedCell) {
        e.preventDefault();
        setSelectedCell([selectedCell[0], Math.min(4, selectedCell[1] + 1)]);
      } else if (e.key === 'ArrowLeft' && selectedCell) {
        e.preventDefault();
        setSelectedCell([selectedCell[0], Math.max(0, selectedCell[1] - 1)]);
      } else if (e.key === 'ArrowDown' && selectedCell) {
        e.preventDefault();
        setSelectedCell([Math.min(4, selectedCell[0] + 1), selectedCell[1]]);
      } else if (e.key === 'ArrowUp' && selectedCell) {
        e.preventDefault();
        setSelectedCell([Math.max(0, selectedCell[0] - 1), selectedCell[1]]);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          handlePrevClue();
        } else {
          handleNextClue();
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedCell) {
          const [r, c] = selectedCell;
          setUserGrid((prev) => {
            const next = prev.map((row) => [...row]);
            next[r][c] = '';
            return next;
          });
        }
      } else if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleInputCharacter(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedCell,
    handlePrevClue,
    handleNextClue,
    handleToggleDirection,
    handleBackspace,
    handleInputCharacter,
  ]);

  // Dispatch workflow
  const handleSendToRemarkable = async () => {
    const { token, repo, defaultDestination } = getStoredSettings();
    const isDaily = defaultDestination === 'daily';

    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'GitHub Token Not Configured',
        detail: 'Please configure your GitHub Fine-Grained PAT in Settings to dispatch puzzles.',
      });
      onOpenSettings();
      return;
    }

    setIsBusy(true);
    const dispatchTime = Date.now();
    const themeParam = activeTheme.toLowerCase() === 'daily' ? '' : activeTheme;

    setStatusMessage({
      type: 'running',
      text: `Dispatching "${activeTheme}" Mini Crossword...`,
      detail: `Connecting to ${repo} GitHub Actions...`,
    });

    try {
      await dispatchWorkflow({
        token,
        repo,
        inputs: {
          puzzle_type: 'mini-crossword',
          crossword_theme: themeParam,
          is_daily: isDaily,
        },
      });

      setStatusMessage({
        type: 'running',
        text: 'Workflow queued on GitHub Actions...',
        detail: 'Generating 5x5 mini crossword with high-contrast e-ink layout...',
      });

      const completedRun = await pollWorkflowRun(token, repo, {
        dispatchTimestamp: dispatchTime,
        timeoutMs: 180000,
        onUpdate: (run: WorkflowRun, elapsedSeconds: number) => {
          if (run.status === 'in_progress') {
            setStatusMessage({
              type: 'running',
              text: `Generating & uploading to reMarkable (${elapsedSeconds}s)...`,
              detail: `Building "${activeTheme}" mini crossword PDF...`,
              runUrl: run.html_url,
            });
          }
        },
      });

      if (completedRun.conclusion === 'success') {
        setStatusMessage({
          type: 'success',
          text: `Delivered "${activeTheme}" Mini Crossword!`,
          detail: `Uploaded to ${isDaily ? '/Puzzles/Daily/' : '/Puzzles/Mini Crossword/'}. Sync your reMarkable to play!`,
          runUrl: completedRun.html_url,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `Workflow Finished with Status: ${completedRun.conclusion || completedRun.status}`,
          detail: 'Check GitHub Actions logs for details.',
          runUrl: completedRun.html_url,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to Dispatch Workflow',
        detail: msg,
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="h-full max-w-md mx-auto flex flex-col justify-between pt-2 pb-2 safe-bottom px-3 select-none touch-manipulation">
      {/* Hidden input to invoke mobile soft keyboard and capture input */}
      <input
        ref={hiddenInputRef}
        type="text"
        value=""
        onChange={(e) => {
          const val = e.target.value;
          if (val) {
            handleInputCharacter(val.slice(-1));
          }
          e.target.value = '';
        }}
        autoCapitalize="characters"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        className="sr-only opacity-0 absolute -top-96 left-0 pointer-events-none"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Top Section */}
      <div className="w-full flex flex-col items-center space-y-2">
        {/* Utility Subheader */}
        <div className="w-full flex items-center justify-between text-xs px-1 text-gray-600">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-800 border border-gray-200 truncate">
              Theme: {activeTheme}
            </span>
            {isSolved && !showSolution && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 animate-pulse">
                🎉 Solved!
              </span>
            )}
            <span className="text-[10px] text-gray-400 font-mono hidden min-[400px]:inline shrink-0">
              #{sampleIndex + 1}/{SAMPLE_PUZZLES.length}
            </span>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowSolution((prev) => !prev)}
              className={`px-2 py-1 text-[11px] font-semibold border rounded-md flex items-center space-x-1 shadow-xs active:scale-95 transition-colors ${
                showSolution
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              title={showSolution ? 'Hide solution' : 'Reveal solution'}
            >
              {showSolution ? (
                <>
                  <EyeOff className="w-3 h-3 text-amber-700" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 text-gray-500" />
                  <span>Reveal</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClearGrid}
              className="px-2 py-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 flex items-center space-x-1 shadow-xs active:scale-95"
              title="Clear entered letters"
            >
              <Eraser className="w-3 h-3 text-gray-500" />
              <span className="hidden min-[360px]:inline">Clear</span>
            </button>

            <button
              type="button"
              onClick={handleToggleDirection}
              className="px-2 py-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 flex items-center space-x-1 shadow-xs active:scale-95"
              title="Toggle Across / Down"
            >
              <RotateCcw className="w-3 h-3 text-gray-500" />
              <span className="capitalize">{direction}</span>
            </button>

            <button
              type="button"
              onClick={handleCycleSample}
              disabled={isBusy}
              className="px-2 py-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 flex items-center space-x-1 shadow-xs active:scale-95"
              title="Cycle sample puzzles"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Sample</span>
            </button>
          </div>
        </div>

        {/* 5x5 Interactive Grid */}
        <div className="flex justify-center select-none touch-manipulation">
          <div className="bg-gray-950 p-1 rounded-xl shadow-md border-2 border-gray-900 inline-block">
            <div className="grid grid-cols-5 bg-gray-900 gap-[1px]">
              {currentPuzzle.grid.map((row, r) =>
                row.map((solutionChar, c) => {
                  const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
                  const isSameWord =
                    selectedCell &&
                    (direction === 'across' ? selectedCell[0] === r : selectedCell[1] === c);
                  const clueNum = CELL_CLUE_NUMBERS[`${r},${c}`];
                  const userChar = userGrid[r]?.[c] || '';
                  const displayChar = showSolution ? solutionChar : userChar;

                  let cellBg = 'bg-white text-gray-900';
                  if (isSelected) {
                    cellBg = 'bg-amber-100 ring-2 ring-inset ring-amber-500 font-bold text-gray-950';
                  } else if (isSameWord) {
                    cellBg = 'bg-amber-50 text-gray-900';
                  }

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onClick={() => handleCellClick(r, c)}
                      className={`w-14 h-14 min-[380px]:w-16 min-[380px]:h-16 relative flex items-center justify-center font-bold uppercase transition-colors focus:outline-none ${cellBg}`}
                    >
                      {clueNum && (
                        <span className="absolute top-0.5 left-1 text-[10px] text-gray-500 font-mono leading-none select-none">
                          {clueNum}
                        </span>
                      )}
                      <span
                        className={`text-xl font-bold uppercase select-none ${
                          showSolution ? 'text-amber-800' : 'text-gray-900'
                        }`}
                      >
                        {displayChar}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Active Clue Inspector Banner */}
        <div className="w-full bg-white px-2 py-2 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between space-x-1.5">
          <button
            type="button"
            onClick={handlePrevClue}
            className="p-1 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            aria-label="Previous clue"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 text-center min-w-0 px-1">
            <div className="text-[11px] font-bold text-gray-950 uppercase tracking-wide flex items-center justify-center space-x-1.5">
              <span>
                {activeClue.number} {activeClue.direction === 'across' ? 'Across' : 'Down'}
              </span>
              <span className="text-gray-400 font-normal">({activeClue.word.length} letters)</span>
            </div>
            <p className="text-xs text-gray-700 italic truncate mt-0.5" title={activeClue.clue}>
              "{activeClue.clue}"
            </p>
          </div>

          <button
            type="button"
            onClick={handleNextClue}
            className="p-1 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            aria-label="Next clue"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Controls Section */}
      <div className="w-full space-y-2">
        {/* Preset Themes & Custom Input */}
        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">
              Crossword Theme
            </span>
            <span className="text-[10px] text-gray-400">Offline seed / AI generation</span>
          </div>

          {/* Theme Chips */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_THEMES.map((theme) => {
              const isSelected = !customTheme.trim() && selectedPreset === theme;
              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() => handleSelectPreset(theme)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-gray-950 text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {theme}
                </button>
              );
            })}
          </div>

          {/* Custom Theme Input */}
          <input
            type="text"
            value={customTheme}
            onChange={(e) => setCustomTheme(e.target.value)}
            placeholder="Or custom theme (e.g. Wildlife, Jazz, Myth)..."
            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        {/* 1-Tap Delivery Action Button */}
        <button
          type="button"
          onClick={handleSendToRemarkable}
          disabled={isBusy}
          className="w-full py-3 px-4 bg-gray-950 hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
        >
          {isBusy ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
          <span>{isBusy ? 'Delivering Mini Crossword...' : 'Send to reMarkable'}</span>
        </button>

        {/* Live Status Banner */}
        {statusMessage.text && (
          <div
            className={`p-2.5 rounded-xl border text-xs space-y-1 ${
              statusMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-gray-50 border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center space-x-1.5 truncate">
                {statusMessage.type === 'running' && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                )}
                {statusMessage.type === 'success' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
                {statusMessage.type === 'error' && (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
                <span className="truncate">{statusMessage.text}</span>
              </span>

              {statusMessage.runUrl && (
                <a
                  href={statusMessage.runUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center text-[11px] shrink-0 ml-1.5"
                >
                  <span>View Run</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )}
            </div>
            {statusMessage.detail && (
              <p className="text-[11px] text-gray-600 truncate mt-0.5">{statusMessage.detail}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
