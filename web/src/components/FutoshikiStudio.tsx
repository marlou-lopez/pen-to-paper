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
  Delete,
} from 'lucide-react';
import {
  FutoshikiDifficulty,
  FutoshikiData,
  FutoshikiInequality,
  createEmptyFutoshikiGrid,
  findFutoshikiViolations,
  isFutoshikiSolved,
  getSampleFutoshiki,
} from '../utils/futoshiki.ts';
import {
  getStoredSettings,
  dispatchWorkflow,
  pollWorkflowRun,
} from '../services/githubApi.ts';

export interface FutoshikiStudioProps {
  onOpenSettings: () => void;
}

const AVAILABLE_SIZES = [4, 5, 6] as const;
type GridSize = (typeof AVAILABLE_SIZES)[number];

const DIFFICULTIES: FutoshikiDifficulty[] = ['easy', 'medium', 'hard'];

function getFirstEditableCell(initialGrid: number[][]): [number, number] {
  for (let r = 0; r < initialGrid.length; r++) {
    for (let c = 0; c < initialGrid[r].length; c++) {
      if (initialGrid[r][c] === 0) {
        return [r, c];
      }
    }
  }
  return [0, 0];
}

export const FutoshikiStudio: React.FC<FutoshikiStudioProps> = ({ onOpenSettings }) => {
  const [size, setSize] = useState<GridSize>(5);
  const [difficulty, setDifficulty] = useState<FutoshikiDifficulty>('medium');
  const [sampleIndex, setSampleIndex] = useState(0);

  const activePuzzle = useMemo<FutoshikiData>(() => {
    return getSampleFutoshiki(size, difficulty, sampleIndex);
  }, [size, difficulty, sampleIndex]);

  const [userGrid, setUserGrid] = useState<number[][]>(() =>
    createEmptyFutoshikiGrid(getSampleFutoshiki(5, 'medium', 0).initialGrid)
  );

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(() =>
    getFirstEditableCell(getSampleFutoshiki(5, 'medium', 0).initialGrid)
  );

  const [showSolution, setShowSolution] = useState(false);

  // Status & dispatch state
  const [statusMessage, setStatusMessage] = useState<{
    type: 'idle' | 'validating' | 'dispatching' | 'running' | 'success' | 'error';
    text: string;
    detail?: string;
    runUrl?: string;
  }>({ type: 'idle', text: '' });
  const [isBusy, setIsBusy] = useState(false);

  // When size or difficulty changes, reset userGrid and selectedCell
  const handleSizeChange = (newSize: GridSize) => {
    if (newSize === size) return;
    setSize(newSize);
    setSampleIndex(0);
    const puzzle = getSampleFutoshiki(newSize, difficulty, 0);
    setUserGrid(createEmptyFutoshikiGrid(puzzle.initialGrid));
    setSelectedCell(getFirstEditableCell(puzzle.initialGrid));
    setShowSolution(false);
    setStatusMessage({ type: 'idle', text: '' });
  };

  const handleDifficultyChange = (newDiff: FutoshikiDifficulty) => {
    if (newDiff === difficulty) return;
    setDifficulty(newDiff);
    setSampleIndex(0);
    const puzzle = getSampleFutoshiki(size, newDiff, 0);
    setUserGrid(createEmptyFutoshikiGrid(puzzle.initialGrid));
    setSelectedCell(getFirstEditableCell(puzzle.initialGrid));
    setShowSolution(false);
    setStatusMessage({ type: 'idle', text: '' });
  };

  const handleResetSample = () => {
    const nextIdx = sampleIndex + 1;
    setSampleIndex(nextIdx);
    const puzzle = getSampleFutoshiki(size, difficulty, nextIdx);
    setUserGrid(createEmptyFutoshikiGrid(puzzle.initialGrid));
    setSelectedCell(getFirstEditableCell(puzzle.initialGrid));
    setShowSolution(false);
    setStatusMessage({
      type: 'idle',
      text: `Loaded ${size}×${size} Futoshiki sample #${(nextIdx % 2) + 1}`,
      detail: `Difficulty: ${difficulty.toUpperCase()}`,
    });
  };

  const handleClearGrid = () => {
    setUserGrid(createEmptyFutoshikiGrid(activePuzzle.initialGrid));
    setShowSolution(false);
    setStatusMessage({
      type: 'idle',
      text: 'Grid cleared to initial clues',
    });
  };

  // Map inequalities to horizontal and vertical gutter slots
  const { horizontalIneqMap, verticalIneqMap } = useMemo(() => {
    const hMap = new Map<string, FutoshikiInequality>();
    const vMap = new Map<string, FutoshikiInequality>();

    for (const ineq of activePuzzle.inequalities) {
      if (ineq.row1 === ineq.row2) {
        const minCol = Math.min(ineq.col1, ineq.col2);
        hMap.set(`${ineq.row1},${minCol}`, ineq);
      } else if (ineq.col1 === ineq.col2) {
        const minRow = Math.min(ineq.row1, ineq.row2);
        vMap.set(`${minRow},${ineq.col1}`, ineq);
      }
    }

    return { horizontalIneqMap: hMap, verticalIneqMap: vMap };
  }, [activePuzzle]);

  // Live computations
  const violations = useMemo(() => {
    return findFutoshikiViolations(userGrid, activePuzzle.inequalities);
  }, [userGrid, activePuzzle.inequalities]);

  const brokenIneqSet = useMemo(() => {
    return new Set(violations.brokenInequalities);
  }, [violations]);

  const violatedCells = useMemo(() => {
    const set = new Set<string>();
    for (const k of violations.duplicateCells) {
      set.add(k);
    }
    for (const ineq of violations.brokenInequalities) {
      set.add(`${ineq.row1},${ineq.col1}`);
      set.add(`${ineq.row2},${ineq.col2}`);
    }
    return set;
  }, [violations]);

  const isSolved = useMemo(() => {
    return isFutoshikiSolved(userGrid, activePuzzle.solution, activePuzzle.inequalities);
  }, [userGrid, activePuzzle]);

  // Digit setter & auto-advance
  const setDigit = useCallback(
    (digit: number) => {
      if (!selectedCell) return;
      const [r, c] = selectedCell;

      // Given clues cannot be modified
      if (activePuzzle.initialGrid[r]?.[c] > 0) {
        return;
      }

      setUserGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = digit;
        return next;
      });

      if (digit > 0) {
        // Auto-advance to next cell in reading order
        if (c < size - 1) {
          setSelectedCell([r, c + 1]);
        } else if (r < size - 1) {
          setSelectedCell([r + 1, 0]);
        }
      }
    },
    [selectedCell, activePuzzle, size]
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
        setDigit(0);
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

  // Validation
  const handleValidate = () => {
    if (isSolved) {
      setStatusMessage({
        type: 'success',
        text: '🎉 Puzzle Solved!',
        detail: 'All inequality constraints and Latin square rows/cols are satisfied!',
      });
      return;
    }

    if (violations.duplicateCells.size > 0) {
      setStatusMessage({
        type: 'error',
        text: 'Duplicate numbers detected',
        detail: `Each row and column must contain digits 1 through ${size} without duplicates.`,
      });
      return;
    }

    if (violations.brokenInequalities.length > 0) {
      setStatusMessage({
        type: 'error',
        text: 'Inequality violated',
        detail: 'One or more inequality relations are broken (highlighted in red).',
      });
      return;
    }

    let emptyCount = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (userGrid[r][c] === 0) emptyCount++;
      }
    }

    if (emptyCount > 0) {
      setStatusMessage({
        type: 'idle',
        text: 'Looking good so far!',
        detail: `${emptyCount} empty cells remaining.`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Incorrect numbers',
        detail: 'The grid is completely filled but does not match the solution.',
      });
    }
  };

  // Deliver to tablet
  const handleSendToRemarkable = async () => {
    const { token, repo, defaultDestination } = getStoredSettings();

    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Missing GitHub Token',
        detail: 'Configure your Personal Access Token in Settings to deliver puzzles.',
      });
      onOpenSettings();
      return;
    }

    setIsBusy(true);
    setStatusMessage({
      type: 'dispatching',
      text: 'Triggering GitHub Actions workflow...',
      detail: `Futoshiki ${size}×${size} (${difficulty})`,
    });

    try {
      const dispatchTimestamp = Date.now();
      await dispatchWorkflow({
        token,
        repo,
        inputs: {
          puzzle_type: 'futoshiki',
          futoshiki_size: String(size),
          futoshiki_difficulty: difficulty,
          is_daily: defaultDestination === 'daily',
        },
      });

      setStatusMessage({
        type: 'running',
        text: 'Generating PDF on GitHub Actions...',
        detail: 'Delivery in progress to your reMarkable tablet...',
      });

      const completedRun = await pollWorkflowRun(token, repo, {
        dispatchTimestamp,
        onUpdate: (run, elapsed) => {
          setStatusMessage({
            type: 'running',
            text: `Workflow in progress (${elapsed}s)...`,
            detail: `Status: ${run.status}${
              run.conclusion ? ` (${run.conclusion})` : ''
            }`,
            runUrl: run.html_url,
          });
        },
      });

      if (completedRun.conclusion === 'success') {
        setStatusMessage({
          type: 'success',
          text: 'Delivered to reMarkable!',
          detail: `Futoshiki ${size}×${size} (${difficulty}) uploaded successfully.`,
          runUrl: completedRun.html_url,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Generation Failed',
          detail: `Run finished with conclusion: ${
            completedRun.conclusion || 'unknown'
          }`,
          runUrl: completedRun.html_url,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: 'error',
        text: 'Delivery Error',
        detail: msg,
      });
    } finally {
      setIsBusy(false);
    }
  };

  // Dimensions & font styling based on size
  const digitFontSize =
    size === 4
      ? 'text-xl sm:text-2xl'
      : size === 5
      ? 'text-lg sm:text-xl'
      : 'text-base sm:text-lg';

  const gutterSize = size === 4 ? '20px' : size === 5 ? '16px' : '14px';
  const gridColTemplate = Array.from({ length: 2 * size - 1 }, (_, i) =>
    i % 2 === 0 ? 'minmax(0, 1fr)' : gutterSize
  ).join(' ');
  const gridRowTemplate = Array.from({ length: 2 * size - 1 }, (_, i) =>
    i % 2 === 0 ? 'minmax(0, 1fr)' : gutterSize
  ).join(' ');

  return (
    <div className="flex flex-col h-full max-w-md mx-auto px-3.5 py-1.5 justify-between safe-bottom select-none">
      {/* Top Controls Area */}
      <div className="space-y-1.5">
        {/* Header Bar: Title & Size Switcher */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-950 flex items-center space-x-1.5">
              <span>Futoshiki Studio</span>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-md">
                {size}×{size}
              </span>
            </h2>
            <p className="text-[11px] text-gray-500">
              Inequality Latin Square · 1 to {size}
            </p>
          </div>

          {/* Size Switcher */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            {AVAILABLE_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSizeChange(s)}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                  size === s
                    ? 'bg-white text-gray-950 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {s}×{s}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Bar & Studio Toggles */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex space-x-1">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => handleDifficultyChange(diff)}
                className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                  difficulty === diff
                    ? 'bg-gray-950 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setShowSolution((prev) => !prev)}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md border flex items-center space-x-1 transition-all shadow-xs active:scale-95 ${
                showSolution
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              title={showSolution ? 'Hide Solution' : 'Reveal Solution'}
            >
              {showSolution ? (
                <EyeOff className="w-3 h-3 text-amber-600" />
              ) : (
                <Eye className="w-3 h-3 text-gray-500" />
              )}
              <span>{showSolution ? 'Hide' : 'Reveal'}</span>
            </button>

            <button
              type="button"
              onClick={handleClearGrid}
              className="px-2 py-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 flex items-center space-x-1 shadow-xs active:scale-95"
              title="Clear entered numbers"
            >
              <Eraser className="w-3 h-3 text-gray-500" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={handleResetSample}
              disabled={isBusy}
              className="px-2 py-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 flex items-center space-x-1 shadow-xs active:scale-95"
              title="Cycle sample puzzle"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Sample</span>
            </button>
          </div>
        </div>

        {/* Solved Banner / Violation Feedback */}
        {isSolved ? (
          <div className="w-full bg-emerald-50 border border-emerald-300 rounded-lg px-2.5 py-1 text-xs text-emerald-950 flex items-center justify-between shadow-xs animate-fadeIn">
            <span className="font-bold flex items-center space-x-1 text-emerald-800">
              <span>🎉 Solved!</span>
              <span className="text-[11px] font-normal text-emerald-700">
                All inequalities and Latin square rows/cols are satisfied.
              </span>
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
          </div>
        ) : (
          <div className="w-full bg-blue-50/70 border border-blue-200 rounded-lg px-2.5 py-1 text-xs text-blue-950 flex items-center justify-between shadow-xs min-h-[30px]">
            <div className="flex items-center space-x-2 truncate">
              {violations.duplicateCells.size > 0 ? (
                <span className="text-[11px] font-bold text-rose-700 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                  <span>Duplicate numbers in row or column</span>
                </span>
              ) : violations.brokenInequalities.length > 0 ? (
                <span className="text-[11px] font-bold text-rose-700 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                  <span>Inequality relation broken</span>
                </span>
              ) : (
                <span className="text-[11px] text-blue-700 font-medium">
                  Fill cells 1–{size} obeying &lt;, &gt;, ∧, ∨ chevrons
                </span>
              )}
            </div>

            {violatedCells.size > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1 bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                Violation
              </span>
            )}
          </div>
        )}

        {/* Responsive Futoshiki Grid with Inter-cell Chevrons */}
        <div className="w-full flex justify-center items-center py-1 select-none">
          <div
            className="w-full max-w-[325px] aspect-square bg-gray-50 p-2 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center"
            style={{ touchAction: 'manipulation' }}
          >
            <div
              className="w-full h-full grid items-stretch"
              style={{
                gridTemplateColumns: gridColTemplate,
                gridTemplateRows: gridRowTemplate,
              }}
            >
              {Array.from({ length: 2 * size - 1 }).map((_, rIdx) =>
                Array.from({ length: 2 * size - 1 }).map((__, cIdx) => {
                  const isCellRow = rIdx % 2 === 0;
                  const isCellCol = cIdx % 2 === 0;

                  // 1. Grid Cell
                  if (isCellRow && isCellCol) {
                    const r = rIdx / 2;
                    const c = cIdx / 2;
                    const isGiven = activePuzzle.initialGrid[r]?.[c] > 0;
                    const isSelected =
                      selectedCell?.[0] === r && selectedCell?.[1] === c;
                    const cellKey = `${r},${c}`;
                    const isViolated = violatedCells.has(cellKey);

                    const displayValue = showSolution
                      ? activePuzzle.solution[r]?.[c]
                      : userGrid[r]?.[c] || '';

                    return (
                      <button
                        key={`cell-${r}-${c}`}
                        type="button"
                        onClick={() => setSelectedCell([r, c])}
                        className={`w-full h-full rounded-lg flex items-center justify-center font-bold transition-all relative border-2 ${digitFontSize} ${
                          isSelected
                            ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-600 z-10'
                            : ''
                        } ${
                          isViolated
                            ? 'bg-rose-100 text-rose-800 border-rose-400 animate-pulse font-black'
                            : showSolution && !isGiven
                            ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                            : isGiven
                            ? 'bg-gray-150 text-gray-950 border-gray-300 font-black'
                            : displayValue
                            ? 'bg-white text-blue-700 border-gray-300 shadow-2xs'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {displayValue || ''}
                      </button>
                    );
                  }

                  // 2. Horizontal Gutter Slot
                  if (isCellRow && !isCellCol) {
                    const r = rIdx / 2;
                    const c = (cIdx - 1) / 2;
                    const ineq = horizontalIneqMap.get(`${r},${c}`);

                    if (!ineq) {
                      return <div key={`h-empty-${rIdx}-${cIdx}`} />;
                    }

                    const leftIsSmaller =
                      ineq.col1 < ineq.col2
                        ? ineq.relation === '<'
                        : ineq.relation === '>';
                    const chevronSymbol = leftIsSmaller ? '<' : '>';
                    const isBroken = brokenIneqSet.has(ineq);

                    return (
                      <div
                        key={`h-ineq-${rIdx}-${cIdx}`}
                        className="flex items-center justify-center w-full h-full"
                      >
                        <span
                          className={`w-4.5 h-4.5 flex items-center justify-center font-black text-xs rounded transition-all select-none pointer-events-none ${
                            isBroken
                              ? 'bg-rose-100 text-rose-700 border border-rose-400 animate-pulse scale-110 shadow-xs'
                              : 'bg-gray-100 text-gray-700 border border-gray-300 shadow-2xs'
                          }`}
                        >
                          {chevronSymbol}
                        </span>
                      </div>
                    );
                  }

                  // 3. Vertical Gutter Slot
                  if (!isCellRow && isCellCol) {
                    const r = (rIdx - 1) / 2;
                    const c = cIdx / 2;
                    const ineq = verticalIneqMap.get(`${r},${c}`);

                    if (!ineq) {
                      return <div key={`v-empty-${rIdx}-${cIdx}`} />;
                    }

                    const topIsSmaller =
                      ineq.row1 < ineq.row2
                        ? ineq.relation === '<'
                        : ineq.relation === '>';
                    const chevronSymbol = topIsSmaller ? '∧' : '∨';
                    const isBroken = brokenIneqSet.has(ineq);

                    return (
                      <div
                        key={`v-ineq-${rIdx}-${cIdx}`}
                        className="flex items-center justify-center w-full h-full"
                      >
                        <span
                          className={`w-4.5 h-4.5 flex items-center justify-center font-black text-xs rounded transition-all select-none pointer-events-none ${
                            isBroken
                              ? 'bg-rose-100 text-rose-700 border border-rose-400 animate-pulse scale-110 shadow-xs'
                              : 'bg-gray-100 text-gray-700 border border-gray-300 shadow-2xs'
                          }`}
                        >
                          {chevronSymbol}
                        </span>
                      </div>
                    );
                  }

                  // 4. Intersection Corner (blank)
                  return <div key={`corner-${rIdx}-${cIdx}`} />;
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls Area */}
      <div className="space-y-1.5 pt-1">
        {/* Status Message / Delivery Progress */}
        {statusMessage.text && (
          <div
            className={`p-2 rounded-xl text-xs border transition-all ${
              statusMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
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
              <p className="text-[11px] text-gray-600 truncate mt-0.5">
                {statusMessage.detail}
              </p>
            )}
          </div>
        )}

        {/* Adaptive Numeric Keypad (1–size, Backspace, Clear) */}
        <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-xs space-y-1.5">
          {/* Row of digits 1..N */}
          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: size }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setDigit(num)}
                className="h-9 min-[380px]:h-10 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-lg text-sm min-[380px]:text-base font-bold text-gray-900 flex items-center justify-center transition-transform active:scale-95 shadow-xs"
              >
                {num}
              </button>
            ))}
          </div>

          {/* Row of action buttons: Backspace & Clear */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setDigit(0)}
              className="h-8 min-[380px]:h-9 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 flex items-center justify-center space-x-1.5 transition-transform active:scale-95 shadow-xs"
              title="Backspace current cell"
            >
              <Delete className="w-3.5 h-3.5 text-gray-500" />
              <span>Backspace</span>
            </button>
            <button
              type="button"
              onClick={handleClearGrid}
              className="h-8 min-[380px]:h-9 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center justify-center space-x-1.5 transition-transform active:scale-95 shadow-xs"
              title="Clear all entered digits"
            >
              <Eraser className="w-3.5 h-3.5 text-rose-500" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: Check & Send to reMarkable */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleValidate}
            disabled={isBusy}
            className="h-10 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-300 font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Check</span>
          </button>

          <button
            type="button"
            onClick={handleSendToRemarkable}
            disabled={isBusy}
            className={`flex-1 h-10 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-98 cursor-pointer ${
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
