import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Send,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Loader2,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import {
  SudokuGrid,
  createEmptyGrid,
  gridToNotation,
  getConflicts,
  countClues,
  validateAndSolve,
} from '../utils/sudoku.ts';
import {
  getStoredSettings,
  dispatchWorkflow,
  pollWorkflowRun,
  WorkflowRun,
} from '../services/githubApi.ts';

interface SudokuStudioProps {
  onOpenSettings: () => void;
}

const SAMPLE_PUZZLE = '53xx7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79';

export const SudokuStudio: React.FC<SudokuStudioProps> = ({ onOpenSettings }) => {
  const [grid, setGrid] = useState<SudokuGrid>(createEmptyGrid);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>([0, 0]);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const difficulty = 'expert';

  // Status & dispatch state
  const [statusMessage, setStatusMessage] = useState<{
    type: 'idle' | 'validating' | 'dispatching' | 'running' | 'success' | 'error';
    text: string;
    detail?: string;
    runUrl?: string;
  }>({ type: 'idle', text: '' });
  const [isBusy, setIsBusy] = useState(false);

  // Compute conflicts
  const conflicts = useMemo(() => getConflicts(grid), [grid]);
  const cluesCount = useMemo(() => countClues(grid), [grid]);

  // Set cell digit
  const setDigit = useCallback(
    (digit: number | null) => {
      if (!selectedCell) return;
      const [r, c] = selectedCell;

      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = digit;
        return next;
      });

      if (digit !== null && autoAdvance) {
        // Advance cursor to next cell in row, then wrap to next row
        if (c < 8) {
          setSelectedCell([r, c + 1]);
        } else if (r < 8) {
          setSelectedCell([r + 1, 0]);
        } else {
          setSelectedCell([0, 0]);
        }
      }
    },
    [selectedCell, autoAdvance]
  );

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if focus is in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        setDigit(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0' || e.key === 'x') {
        e.preventDefault();
        setDigit(null);
      } else if (e.key === 'ArrowRight' && selectedCell) {
        e.preventDefault();
        setSelectedCell([selectedCell[0], Math.min(8, selectedCell[1] + 1)]);
      } else if (e.key === 'ArrowLeft' && selectedCell) {
        e.preventDefault();
        setSelectedCell([selectedCell[0], Math.max(0, selectedCell[1] - 1)]);
      } else if (e.key === 'ArrowDown' && selectedCell) {
        e.preventDefault();
        setSelectedCell([Math.min(8, selectedCell[0] + 1), selectedCell[1]]);
      } else if (e.key === 'ArrowUp' && selectedCell) {
        e.preventDefault();
        setSelectedCell([Math.max(0, selectedCell[0] - 1), selectedCell[1]]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, setDigit]);

  // Load sample puzzle
  const handleLoadSample = () => {
    const rows = SAMPLE_PUZZLE.split('/');
    const sampleGrid: SudokuGrid = rows.map((row) =>
      row.split('').map((ch) => (ch === 'x' ? null : parseInt(ch, 10)))
    );
    setGrid(sampleGrid);
    setSelectedCell([0, 0]);
    setStatusMessage({
      type: 'idle',
      text: 'Sample book puzzle loaded! Ready to validate or dispatch.',
    });
  };

  const handleClearBoard = () => {
    setGrid(createEmptyGrid());
    setSelectedCell([0, 0]);
    setStatusMessage({ type: 'idle', text: '' });
  };

  // Client-side solver validation
  const handleValidate = () => {
    if (cluesCount === 0) {
      setStatusMessage({
        type: 'error',
        text: 'The grid is currently empty.',
        detail: 'Enter clues from your physical Sudoku book before validating.',
      });
      return false;
    }

    const result = validateAndSolve(grid);
    if (!result.valid || !result.solvable) {
      setStatusMessage({
        type: 'error',
        text: 'Sudoku Validation Error',
        detail: result.error || 'The board contains errors or is unsolvable.',
      });
      return false;
    }

    setStatusMessage({
      type: 'idle',
      text: `✓ Valid and solvable puzzle (${cluesCount} clues). Backtracking solver verified unique/valid solution!`,
    });
    return true;
  };

  // Dispatch to GitHub Actions
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

    if (cluesCount < 10) {
      setStatusMessage({
        type: 'error',
        text: 'Too Few Clues',
        detail: `You have entered ${cluesCount} clues. Standard Sudokus typically have 17-35 clues. Please enter more clues.`,
      });
      return;
    }

    // Validate client-side first
    const valResult = validateAndSolve(grid);
    if (!valResult.valid || !valResult.solvable) {
      setStatusMessage({
        type: 'error',
        text: 'Cannot Dispatch Unsolvable Board',
        detail: valResult.error || 'Please correct conflicting or invalid clues.',
      });
      return;
    }

    const notation = gridToNotation(grid);

    setIsBusy(true);
    setStatusMessage({
      type: 'dispatching',
      text: 'Triggering GitHub Actions workflow...',
      detail: `Dispatching custom grid to ${repo}...`,
    });

    const dispatchTime = Date.now();

    try {
      await dispatchWorkflow({
        token,
        repo,
        inputs: {
          puzzle_type: 'sudoku',
          sudoku_difficulty: difficulty,
          sudoku_grid: notation,
          is_daily: isDaily,
        },
      });

      setStatusMessage({
        type: 'running',
        text: 'Workflow queued on GitHub Actions...',
        detail: 'Building custom puzzle PDF with reMarkable e-ink layout...',
      });

      // Poll run
      const completedRun = await pollWorkflowRun(token, repo, {
        dispatchTimestamp: dispatchTime,
        timeoutMs: 180000,
        onUpdate: (run: WorkflowRun, elapsedSeconds: number) => {
          if (run.status === 'in_progress') {
            setStatusMessage({
              type: 'running',
              text: `Generating & uploading to reMarkable (${elapsedSeconds}s)...`,
              detail: `Run #${run.id} is currently executing.`,
              runUrl: run.html_url,
            });
          }
        },
      });

      if (completedRun.conclusion === 'success') {
        setStatusMessage({
          type: 'success',
          text: 'Delivered to your reMarkable!',
          detail: `Rendered and uploaded to ${isDaily ? '/Puzzles/Daily/' : '/Puzzles/Sudoku/'}. Sync your tablet to play!`,
          runUrl: completedRun.html_url,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `Workflow Finished with Status: ${completedRun.conclusion || completedRun.status}`,
          detail: 'Check GitHub Actions logs for details (e.g. check rmapi auth token secret).',
          runUrl: completedRun.html_url,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: 'error',
        text: 'Dispatch or Polling Failed',
        detail: msg,
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="h-full max-w-md mx-auto flex flex-col justify-between pt-2 pb-2 safe-bottom px-3 select-none touch-manipulation">
      {/* Top / Grid Section */}
      <div className="w-full flex flex-col items-center space-y-1.5">
        {/* Utility Subheader */}
        <div className="w-full flex items-center justify-between text-xs px-1 text-gray-600">
          <label className="flex items-center space-x-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-gray-900 focus:ring-gray-900 border-gray-300"
            />
            <span className="text-[11px] font-medium">Auto-advance</span>
          </label>

          <span className="text-[11px] text-gray-400 font-mono">
            {cluesCount} / 81 clues
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handleLoadSample}
              disabled={isBusy}
              className="px-2 py-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 flex items-center space-x-1 shadow-sm active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Sample</span>
            </button>
            <button
              type="button"
              onClick={handleClearBoard}
              disabled={isBusy}
              title="Clear grid"
              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 9x9 Interactive Sudoku Grid */}
        <div className="flex justify-center select-none touch-manipulation">
          <div className="bg-gray-950 p-0.5 min-[380px]:p-1 rounded-xl shadow-md border-2 border-gray-900">
            <div className="grid grid-cols-9 bg-gray-300 gap-[1px]">
              {grid.map((row, r) =>
                row.map((val, c) => {
                  const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
                  const isConflicted = conflicts.has(`${r},${c}`);
                  const isSameRowOrCol =
                    selectedCell && (selectedCell[0] === r || selectedCell[1] === c);
                  const isSameBox =
                    selectedCell &&
                    Math.floor(selectedCell[0] / 3) === Math.floor(r / 3) &&
                    Math.floor(selectedCell[1] / 3) === Math.floor(c / 3);

                  // Thick 3x3 box borders
                  const borderRight = (c + 1) % 3 === 0 && c < 8 ? 'border-r-2 border-r-gray-900' : '';
                  const borderBottom = (r + 1) % 3 === 0 && r < 8 ? 'border-b-2 border-b-gray-900' : '';

                  let cellBg = 'bg-white';
                  if (isConflicted) {
                    cellBg = 'bg-rose-100 text-rose-700 font-bold';
                  } else if (isSelected) {
                    cellBg = 'bg-amber-100 font-bold text-gray-950 ring-2 ring-inset ring-amber-500';
                  } else if (isSameRowOrCol || isSameBox) {
                    cellBg = 'bg-gray-50';
                  }

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onClick={() => setSelectedCell([r, c])}
                      className={`w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 min-[420px]:w-10 min-[420px]:h-10 flex items-center justify-center font-semibold text-base focus:outline-none transition-colors ${cellBg} ${borderRight} ${borderBottom}`}
                    >
                      {val !== null ? val : ''}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls Section */}
      <div className="w-full space-y-1.5">
        {/* Status Toast / Non-Expanding Banner */}
        {(statusMessage.text || conflicts.size > 0) && (
          <div
            className={`px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
              statusMessage.type === 'error' || (conflicts.size > 0 && !statusMessage.text)
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-gray-50 border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center space-x-1.5 truncate">
                {(statusMessage.type === 'running' ||
                  statusMessage.type === 'dispatching' ||
                  statusMessage.type === 'validating') && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                )}
                {statusMessage.type === 'success' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
                {(statusMessage.type === 'error' || (conflicts.size > 0 && !statusMessage.text)) && (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
                <span className="truncate">
                  {statusMessage.text ||
                    `${conflicts.size} conflicting cell${conflicts.size > 1 ? 's' : ''} in row, col, or box`}
                </span>
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

        {/* Floating On-Screen Numeric Keypad (1–9, Clear) */}
        <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-xs space-y-1.5">
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setDigit(num)}
                className="h-9 min-[380px]:h-10 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-lg text-base min-[380px]:text-lg font-bold text-gray-900 flex items-center justify-center transition-transform active:scale-95 shadow-xs"
              >
                {num}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setDigit(num)}
                className="h-9 min-[380px]:h-10 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-lg text-base min-[380px]:text-lg font-bold text-gray-900 flex items-center justify-center transition-transform active:scale-95 shadow-xs"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setDigit(null)}
              className="h-9 min-[380px]:h-10 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center justify-center transition-transform active:scale-95 shadow-sm"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleValidate}
            disabled={isBusy}
            className="h-10 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-300 font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 active:scale-95"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Check</span>
          </button>

          <button
            type="button"
            onClick={handleSendToRemarkable}
            disabled={isBusy || conflicts.size > 0}
            className="h-10 flex-1 px-4 bg-gray-950 hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
          >
            {isBusy ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
            <span>{isBusy ? 'Processing...' : 'Send to reMarkable'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
