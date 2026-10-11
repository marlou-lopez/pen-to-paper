import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Send,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Loader2,
  ExternalLink,
  FolderTree,
  Inbox,
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
  const [isDaily, setIsDaily] = useState(false); // default: category folder (/Puzzles/Sudoku/)
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
    const { token, repo } = getStoredSettings();

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
    <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
      {/* Top Banner / Studio Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-950 flex items-center space-x-1.5">
            <span>Sudoku Studio</span>
          </h1>
          <p className="text-xs text-gray-500">Transcribe physical books or create custom grids</p>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={isBusy}
            title="Load sample puzzle"
            className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-1 shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Sample</span>
          </button>
          <button
            type="button"
            onClick={handleClearBoard}
            disabled={isBusy}
            title="Clear grid"
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Destination & Auto-advance Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-700">Delivery Destination</span>
          <div className="flex bg-gray-100 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setIsDaily(false)}
              className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all flex items-center space-x-1 ${
                !isDaily ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'text-gray-500'
              }`}
            >
              <FolderTree className="w-3 h-3" />
              <span>/Puzzles/Sudoku/</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDaily(true)}
              className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all flex items-center space-x-1 ${
                isDaily ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'text-gray-500'
              }`}
            >
              <Inbox className="w-3 h-3" />
              <span>/Puzzles/Daily/</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
          <label className="flex items-center space-x-2 cursor-pointer text-gray-600 select-none">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="w-4 h-4 rounded text-gray-900 focus:ring-gray-900 border-gray-300"
            />
            <span>Auto-advance cursor</span>
          </label>

          <span className="text-[11px] text-gray-400 font-mono">
            {cluesCount} / 81 clues
          </span>
        </div>
      </div>

      {/* 9x9 Interactive Sudoku Grid */}
      <div className="flex justify-center select-none touch-manipulation">
        <div className="bg-gray-950 p-1 rounded-xl shadow-md border-2 border-gray-900">
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
                    className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-base sm:text-lg font-semibold transition-colors focus:outline-none ${cellBg} ${borderRight} ${borderBottom}`}
                  >
                    {val !== null ? val : ''}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Conflict / Clues Warning if any */}
      {conflicts.size > 0 && (
        <div className="flex items-center space-x-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>
            {conflicts.size} cells have duplicate conflict in row, column, or 3x3 box (highlighted red).
          </span>
        </div>
      )}

      {/* Floating On-Screen Numeric Keypad (1–9, Clear) */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm space-y-2">
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setDigit(num)}
              className="h-12 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-xl text-lg font-bold text-gray-900 flex items-center justify-center transition-transform active:scale-95 shadow-xs"
            >
              {num}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setDigit(num)}
              className="h-12 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-xl text-lg font-bold text-gray-900 flex items-center justify-center transition-transform active:scale-95 shadow-xs"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDigit(null)}
            className="h-12 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center justify-center transition-transform active:scale-95 shadow-xs"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Validation & Send Actions */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleValidate}
            disabled={isBusy}
            className="px-4 py-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-300 font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Validate</span>
          </button>

          <button
            type="button"
            onClick={handleSendToRemarkable}
            disabled={isBusy || conflicts.size > 0}
            className="flex-1 py-3 px-4 bg-gray-950 hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
          >
            {isBusy ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
            <span>{isBusy ? 'Processing...' : 'Send to reMarkable'}</span>
          </button>
        </div>

        {/* Live Status Banner */}
        {statusMessage.text && (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-1 ${
              statusMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-gray-50 border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center space-x-1.5">
                {statusMessage.type === 'running' && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                )}
                {statusMessage.type === 'success' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                )}
                {statusMessage.type === 'error' && (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span>{statusMessage.text}</span>
              </span>

              {statusMessage.runUrl && (
                <a
                  href={statusMessage.runUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center text-[11px]"
                >
                  <span>View Run</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
            {statusMessage.detail && (
              <p className="text-[11px] text-gray-600">{statusMessage.detail}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
