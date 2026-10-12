import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Send,
  Check,
  Sparkles,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Eraser,
} from 'lucide-react';
import {
  KenKenDifficulty,
  createEmptyKenKenGrid,
  isKenKenSolved,
  getBorderStylesForCell,
  SAMPLE_KENKEN_PUZZLES,
  KenKenCage,
} from '../utils/kenken.ts';
import {
  getStoredSettings,
  dispatchWorkflow,
  pollWorkflowRun,
  WorkflowRun,
} from '../services/githubApi.ts';

export interface KenKenStudioProps {
  onOpenSettings: () => void;
}

const AVAILABLE_SIZES = [3, 4, 5, 6, 7, 8, 9] as const;
type GridSize = (typeof AVAILABLE_SIZES)[number];

const DIFFICULTIES: KenKenDifficulty[] = ['easy', 'medium', 'hard'];

function formatOpSymbol(op: string): string {
  switch (op) {
    case '+':
      return '+';
    case '-':
      return '−';
    case '*':
      return '×';
    case '/':
      return '÷';
    default:
      return '';
  }
}

function getOpName(op: string): string {
  switch (op) {
    case '+':
      return 'Addition';
    case '-':
      return 'Subtraction';
    case '*':
      return 'Multiplication';
    case '/':
      return 'Division';
    default:
      return 'Single cell';
  }
}

export const KenKenStudio: React.FC<KenKenStudioProps> = ({ onOpenSettings }) => {
  const [size, setSize] = useState<GridSize>(6);
  const [difficulty, setDifficulty] = useState<KenKenDifficulty>('medium');
  const [userGrid, setUserGrid] = useState<(number | null)[][]>(() => createEmptyKenKenGrid(6));
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>([0, 0]);
  const [showSolution, setShowSolution] = useState(false);

  // Status & dispatch state
  const [statusMessage, setStatusMessage] = useState<{
    type: 'idle' | 'validating' | 'dispatching' | 'running' | 'success' | 'error';
    text: string;
    detail?: string;
    runUrl?: string;
  }>({ type: 'idle', text: '' });
  const [isBusy, setIsBusy] = useState(false);

  const activePuzzle = useMemo(() => {
    return SAMPLE_KENKEN_PUZZLES[size] || SAMPLE_KENKEN_PUZZLES[6];
  }, [size]);

  // Map each cell to cage and cage ID
  const { cellToCage, cellToCageId, cageClueCells } = useMemo(() => {
    const cageMap = new Map<string, KenKenCage>();
    const idMap = new Map<string, number>();
    const clueCells = new Map<string, string>(); // "r,c" -> "12x"

    for (const cage of activePuzzle.cages) {
      // Find top-left cell to anchor the clue label
      let minCell = cage.cells[0];
      for (const cell of cage.cells) {
        cageMap.set(`${cell.row},${cell.col}`, cage);
        idMap.set(`${cell.row},${cell.col}`, cage.id);
        if (
          cell.row < minCell.row ||
          (cell.row === minCell.row && cell.col < minCell.col)
        ) {
          minCell = cell;
        }
      }
      const opSym = formatOpSymbol(cage.op);
      clueCells.set(`${minCell.row},${minCell.col}`, `${cage.target}${opSym}`);
    }

    return { cellToCage: cageMap, cellToCageId: idMap, cageClueCells: clueCells };
  }, [activePuzzle]);

  // Compute active cage for currently selected cell
  const activeCage = useMemo(() => {
    if (!selectedCell) return null;
    return cellToCage.get(`${selectedCell[0]},${selectedCell[1]}`) || null;
  }, [selectedCell, cellToCage]);

  // Compute row and column Latin square conflicts
  const conflicts = useMemo(() => {
    const conflictSet = new Set<string>();

    // Row conflicts
    for (let r = 0; r < size; r++) {
      const counts = new Map<number, number[]>();
      for (let c = 0; c < size; c++) {
        const val = userGrid[r]?.[c];
        if (val !== null && val !== undefined) {
          const list = counts.get(val) || [];
          list.push(c);
          counts.set(val, list);
        }
      }
      for (const [, cols] of counts.entries()) {
        if (cols.length > 1) {
          for (const c of cols) conflictSet.add(`${r},${c}`);
        }
      }
    }

    // Column conflicts
    for (let c = 0; c < size; c++) {
      const counts = new Map<number, number[]>();
      for (let r = 0; r < size; r++) {
        const val = userGrid[r]?.[c];
        if (val !== null && val !== undefined) {
          const list = counts.get(val) || [];
          list.push(r);
          counts.set(val, list);
        }
      }
      for (const [, rows] of counts.entries()) {
        if (rows.length > 1) {
          for (const r of rows) conflictSet.add(`${r},${c}`);
        }
      }
    }

    return conflictSet;
  }, [userGrid, size]);

  // Solved state
  const isSolved = useMemo(() => {
    return isKenKenSolved(userGrid, activePuzzle);
  }, [userGrid, activePuzzle]);

  // Check whether active cage currently satisfies its math condition
  const activeCageStatus = useMemo(() => {
    if (!activeCage) return null;
    const values = activeCage.cells.map((cell) => userGrid[cell.row]?.[cell.col]);
    const isFilled = values.every((v) => v !== null && v !== undefined);
    if (!isFilled) return { isFilled: false, isValid: false };

    const nums = values as number[];
    let isValid = false;
    if (activeCage.op === 'none') {
      isValid = nums[0] === activeCage.target;
    } else if (activeCage.op === '+') {
      isValid = nums.reduce((a, b) => a + b, 0) === activeCage.target;
    } else if (activeCage.op === '*') {
      isValid = nums.reduce((a, b) => a * b, 1) === activeCage.target;
    } else if (activeCage.op === '-') {
      isValid = nums.length === 2 && Math.abs(nums[0] - nums[1]) === activeCage.target;
    } else if (activeCage.op === '/') {
      if (nums.length === 2) {
        const max = Math.max(nums[0], nums[1]);
        const min = Math.min(nums[0], nums[1]);
        isValid = min > 0 && max % min === 0 && max / min === activeCage.target;
      }
    }
    return { isFilled: true, isValid };
  }, [activeCage, userGrid]);

  // Digit setter & auto-advance
  const setDigit = useCallback(
    (digit: number | null) => {
      if (!selectedCell) return;
      const [r, c] = selectedCell;

      setUserGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = digit;
        return next;
      });

      if (digit !== null) {
        if (c < size - 1) {
          setSelectedCell([r, c + 1]);
        } else if (r < size - 1) {
          setSelectedCell([r + 1, 0]);
        } else {
          setSelectedCell([0, 0]);
        }
      }
    },
    [selectedCell, size]
  );

  // Keyboard navigation & digit input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= size) {
        e.preventDefault();
        setDigit(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0' || e.key === 'x') {
        e.preventDefault();
        setDigit(null);
      } else if (e.key === 'ArrowRight' && selectedCell) {
        e.preventDefault();
        setSelectedCell([selectedCell[0], Math.min(size - 1, selectedCell[1] + 1)]);
      } else if (e.key === 'ArrowLeft' && selectedCell) {
        e.preventDefault();
        setSelectedCell([selectedCell[0], Math.max(0, selectedCell[1] - 1)]);
      } else if (e.key === 'ArrowDown' && selectedCell) {
        e.preventDefault();
        setSelectedCell([Math.min(size - 1, selectedCell[0] + 1), selectedCell[1]]);
      } else if (e.key === 'ArrowUp' && selectedCell) {
        e.preventDefault();
        setSelectedCell([Math.max(0, selectedCell[0] - 1), selectedCell[1]]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, setDigit, size]);

  // Handle changing size
  const handleSelectSize = (newSize: GridSize) => {
    if (newSize === size) return;
    setSize(newSize);
    setUserGrid(createEmptyKenKenGrid(newSize));
    setSelectedCell([0, 0]);
    setShowSolution(false);
    setStatusMessage({ type: 'idle', text: '' });
  };

  // Clear entered digits
  const handleClearGrid = () => {
    setUserGrid(createEmptyKenKenGrid(size));
    setShowSolution(false);
    setStatusMessage({ type: 'idle', text: '' });
  };

  // Reload or reset sample puzzle
  const handleResetSample = () => {
    setUserGrid(createEmptyKenKenGrid(size));
    setShowSolution(false);
    setStatusMessage({
      type: 'idle',
      text: `Loaded verified ${size}×${size} KenKen sample puzzle`,
    });
  };

  // Manual Check validation
  const handleValidate = () => {
    if (isSolved) {
      setStatusMessage({
        type: 'success',
        text: '🎉 Puzzle Solved!',
        detail: 'All cage arithmetic and Latin square constraints are satisfied!',
      });
      return;
    }

    if (conflicts.size > 0) {
      setStatusMessage({
        type: 'error',
        text: 'Duplicate numbers detected',
        detail: 'Each row and column must contain digits 1 through ' + size + ' without duplicates.',
      });
      return;
    }

    let emptyCount = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (userGrid[r][c] === null) emptyCount++;
      }
    }

    if (emptyCount > 0) {
      setStatusMessage({
        type: 'idle',
        text: `${emptyCount} empty cell${emptyCount > 1 ? 's' : ''} remaining`,
        detail: 'Keep solving or toggle Reveal to view the solution matrix.',
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: 'One or more cages are incorrect',
        detail: 'Double check the math targets and operators for each cage.',
      });
    }
  };

  // 1-Tap Delivery to reMarkable
  const handleSendToRemarkable = async () => {
    const settings = getStoredSettings();
    if (!settings.token) {
      onOpenSettings();
      return;
    }

    setIsBusy(true);
    setStatusMessage({
      type: 'running',
      text: 'Dispatching KenKen generation...',
      detail: `Requesting ${size}×${size} (${difficulty}) KenKen puzzle...`,
    });

    try {
      const isDaily = settings.defaultDestination === 'daily';
      const dispatchTimestamp = Date.now();

      await dispatchWorkflow({
        token: settings.token,
        repo: settings.repo,
        inputs: {
          puzzle_type: 'kenken',
          kenken_size: String(size),
          kenken_difficulty: difficulty,
          is_daily: isDaily,
        },
      });

      setStatusMessage({
        type: 'running',
        text: 'Workflow dispatched. Waiting for run to start...',
        detail: 'Connecting to GitHub Actions...',
      });

      const completedRun = await pollWorkflowRun(settings.token, settings.repo, {
        dispatchTimestamp,
        onUpdate: (run: WorkflowRun, elapsedSeconds: number) => {
          setStatusMessage({
            type: 'running',
            text: `Generating & uploading to reMarkable (${elapsedSeconds}s)...`,
            detail: `Building ${size}×${size} ${difficulty} KenKen PDF...`,
            runUrl: run.html_url,
          });
        },
      });

      if (completedRun.conclusion === 'success') {
        setStatusMessage({
          type: 'success',
          text: `Delivered ${size}×${size} KenKen!`,
          detail: `Uploaded to ${isDaily ? '/Puzzles/Daily/' : '/Puzzles/KenKen/'}. Sync your reMarkable to play!`,
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

  // Keypad row division
  const keypadNumbers = useMemo(() => {
    return Array.from({ length: size }, (_, i) => i + 1);
  }, [size]);

  const { keypadRow1, keypadRow2 } = useMemo(() => {
    if (size <= 5) {
      return { keypadRow1: keypadNumbers, keypadRow2: [] };
    }
    const mid = Math.ceil(size / 2);
    return {
      keypadRow1: keypadNumbers.slice(0, mid),
      keypadRow2: keypadNumbers.slice(mid),
    };
  }, [size, keypadNumbers]);

  return (
    <div className="h-full max-w-md mx-auto flex flex-col justify-between pt-1.5 pb-2 safe-bottom px-3 select-none touch-manipulation">
      {/* Top Header & Settings Chips */}
      <div className="w-full flex flex-col items-center space-y-1.5">
        {/* Size chips & Difficulty bar */}
        <div className="w-full flex items-center justify-between text-xs px-0.5">
          {/* Size chips */}
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5">
            {AVAILABLE_SIZES.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => handleSelectSize(sz)}
                className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-all whitespace-nowrap active:scale-95 ${
                  size === sz
                    ? 'bg-gray-950 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {sz}×{sz}
              </button>
            ))}
          </div>

          {/* Difficulty selector */}
          <div className="flex items-center space-x-0.5 shrink-0 ml-1">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficulty(diff)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize transition-all ${
                  difficulty === diff
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Utility Bar */}
        <div className="w-full flex items-center justify-between text-xs px-0.5">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-200 truncate">
              KenKen {size}×{size}
            </span>
            {isSolved && !showSolution && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 animate-pulse">
                🎉 Solved!
              </span>
            )}
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
              title="Clear entered digits"
            >
              <Eraser className="w-3 h-3 text-gray-500" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={handleResetSample}
              disabled={isBusy}
              className="px-2 py-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 flex items-center space-x-1 shadow-xs active:scale-95"
              title="Reset sample puzzle"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Sample</span>
            </button>
          </div>
        </div>

        {/* Active Cage Math Badge Banner */}
        {activeCage && (
          <div className="w-full bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 text-xs text-blue-950 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-1.5 truncate">
              <span className="font-bold text-blue-800 bg-blue-100 border border-blue-200 px-1.5 py-0.2 rounded text-[11px]">
                Cage: {activeCage.target}
                {formatOpSymbol(activeCage.op)}
              </span>
              <span className="text-[11px] text-blue-900 truncate">
                Target: <strong>{activeCage.target}</strong>
                <span className="text-blue-600 ml-1 hidden min-[360px]:inline">
                  • {getOpName(activeCage.op)} ({activeCage.cells.length} cells)
                </span>
              </span>
            </div>

            {activeCageStatus?.isFilled && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1 ${
                  activeCageStatus.isValid
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                }`}
              >
                {activeCageStatus.isValid ? '✓ Target Met' : '✗ Math Error'}
              </span>
            )}
          </div>
        )}

        {/* Interactive Responsive KenKen Grid */}
        <div className="w-full flex justify-center items-center py-1 select-none">
          <div
            className="w-full max-w-[320px] aspect-square bg-gray-950 p-[2px] rounded-xl shadow-md border-2 border-gray-950 flex flex-col"
            style={{ touchAction: 'manipulation' }}
          >
            <div
              className="w-full h-full grid"
              style={{
                gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: size }).map((_, r) =>
                Array.from({ length: size }).map((__, c) => {
                  const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
                  const isInActiveCage =
                    activeCage &&
                    activeCage.cells.some((cell) => cell.row === r && cell.col === c);
                  const isConflict = conflicts.has(`${r},${c}`);
                  const clueText = cageClueCells.get(`${r},${c}`);
                  const userVal = userGrid[r]?.[c];
                  const solutionVal = activePuzzle.grid[r]?.[c];
                  const displayVal = showSolution ? solutionVal : userVal ?? '';

                  const borderStyles = getBorderStylesForCell(r, c, size, cellToCageId);

                  let cellBg = 'bg-white';
                  if (isSelected) {
                    cellBg = 'bg-amber-100 ring-2 ring-inset ring-amber-500 z-10';
                  } else if (isInActiveCage) {
                    cellBg = 'bg-blue-50/80';
                  } else if (isConflict) {
                    cellBg = 'bg-rose-50';
                  }

                  const digitFontSize =
                    size <= 4
                      ? 'text-2xl'
                      : size <= 6
                      ? 'text-lg'
                      : size <= 7
                      ? 'text-base'
                      : 'text-sm font-bold';

                  const clueFontSize =
                    size <= 4
                      ? 'text-sm'
                      : size <= 6
                      ? 'text-xs'
                      : size <= 7
                      ? 'text-[11px]'
                      : 'text-[10px]';

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onClick={() => setSelectedCell([r, c])}
                      style={borderStyles}
                      className={`relative flex items-center justify-center transition-colors cursor-pointer border-gray-900 ${cellBg}`}
                    >
                      {/* Cage clue in upper-left corner */}
                      {clueText && (
                        <span
                          className={`absolute top-0.5 left-1 font-extrabold text-gray-950 leading-none select-none pointer-events-none ${clueFontSize}`}
                        >
                          {clueText}
                        </span>
                      )}

                      {/* Cell Value */}
                      <span
                        className={`font-bold transition-all select-none ${digitFontSize} ${
                          showSolution
                            ? 'text-amber-800 font-extrabold'
                            : isConflict
                            ? 'text-rose-600'
                            : 'text-gray-950'
                        }`}
                      >
                        {displayVal}
                      </span>
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
        {statusMessage.text && (
          <div
            className={`px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
              statusMessage.type === 'error'
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

        {/* Floating On-Screen Numeric Keypad (1–N, Clear) */}
        <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-xs space-y-1.5">
          {size <= 5 ? (
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${size + 1}, minmax(0, 1fr))` }}
            >
              {keypadRow1.map((num) => (
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
                className="h-9 min-[380px]:h-10 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center justify-center transition-transform active:scale-95 shadow-xs"
              >
                Clear
              </button>
            </div>
          ) : (
            <>
              <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${keypadRow1.length}, minmax(0, 1fr))` }}
              >
                {keypadRow1.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDigit(num)}
                    className="h-8 min-[380px]:h-9 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-lg text-sm min-[380px]:text-base font-bold text-gray-900 flex items-center justify-center transition-transform active:scale-95 shadow-xs"
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${keypadRow2.length + 1}, minmax(0, 1fr))` }}
              >
                {keypadRow2.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDigit(num)}
                    className="h-8 min-[380px]:h-9 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-lg text-sm min-[380px]:text-base font-bold text-gray-900 flex items-center justify-center transition-transform active:scale-95 shadow-xs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setDigit(null)}
                  className="h-8 min-[380px]:h-9 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center justify-center transition-transform active:scale-95 shadow-xs"
                >
                  Clear
                </button>
              </div>
            </>
          )}
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
            disabled={isBusy}
            className={`flex-1 h-10 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-98 ${
              isBusy
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gray-950 hover:bg-gray-900 text-white shadow-md active:bg-black'
            }`}
          >
            {isBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                <span>Delivering...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send to reMarkable</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
