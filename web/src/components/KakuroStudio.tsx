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
  KakuroDifficulty,
  KakuroData,
  KakuroCell,
  createEmptyKakuroGrid,
  computeRunSums,
  findDuplicateRunDigits,
  isKakuroSolved,
  getSampleKakuroBySize,
} from '../utils/kakuro.ts';
import {
  getStoredSettings,
  dispatchWorkflow,
  pollWorkflowRun,
} from '../services/githubApi.ts';

export interface KakuroStudioProps {
  onOpenSettings: () => void;
}

const AVAILABLE_SIZES = [6, 8, 10] as const;
type KakuroSize = (typeof AVAILABLE_SIZES)[number];

const DIFFICULTIES: KakuroDifficulty[] = ['easy', 'medium', 'hard'];

function getFirstWhiteCell(grid: KakuroCell[][]): [number, number] {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c].type === 'white') {
        return [r, c];
      }
    }
  }
  return [0, 0];
}

export const KakuroStudio: React.FC<KakuroStudioProps> = ({ onOpenSettings }) => {
  const [size, setSize] = useState<KakuroSize>(8);
  const [difficulty, setDifficulty] = useState<KakuroDifficulty>('medium');

  const activePuzzle = useMemo<KakuroData>(() => {
    return getSampleKakuroBySize(size, difficulty);
  }, [size, difficulty]);

  const [userGrid, setUserGrid] = useState<(number | null)[][]>(() =>
    createEmptyKakuroGrid(getSampleKakuroBySize(8, 'medium').grid)
  );

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(() =>
    getFirstWhiteCell(getSampleKakuroBySize(8, 'medium').grid)
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
  const handleSizeChange = (newSize: KakuroSize) => {
    setSize(newSize);
    const puzzle = getSampleKakuroBySize(newSize, difficulty);
    setUserGrid(createEmptyKakuroGrid(puzzle.grid));
    setSelectedCell(getFirstWhiteCell(puzzle.grid));
    setShowSolution(false);
    setStatusMessage({ type: 'idle', text: '' });
  };

  const handleDifficultyChange = (newDiff: KakuroDifficulty) => {
    setDifficulty(newDiff);
    const puzzle = getSampleKakuroBySize(size, newDiff);
    setUserGrid(createEmptyKakuroGrid(puzzle.grid));
    setSelectedCell(getFirstWhiteCell(puzzle.grid));
    setShowSolution(false);
    setStatusMessage({ type: 'idle', text: '' });
  };

  const handleResetSample = () => {
    setUserGrid(createEmptyKakuroGrid(activePuzzle.grid));
    setSelectedCell(getFirstWhiteCell(activePuzzle.grid));
    setShowSolution(false);
    setStatusMessage({
      type: 'idle',
      text: 'Sample grid reset',
      detail: `${activePuzzle.title} (${size}×${size})`,
    });
  };

  const handleClearGrid = () => {
    setUserGrid(createEmptyKakuroGrid(activePuzzle.grid));
    setStatusMessage({
      type: 'idle',
      text: 'Grid cleared',
    });
  };

  // Live computations
  const liveRunSums = useMemo(() => {
    return computeRunSums(userGrid, activePuzzle.runs);
  }, [userGrid, activePuzzle.runs]);

  const duplicateCells = useMemo(() => {
    return findDuplicateRunDigits(userGrid, activePuzzle.runs);
  }, [userGrid, activePuzzle.runs]);

  const isSolved = useMemo(() => {
    return isKakuroSolved(userGrid, activePuzzle.runs);
  }, [userGrid, activePuzzle.runs]);

  // Identify active Across and Down runs for the selected cell
  const { activeAcrossRun, activeDownRun } = useMemo(() => {
    if (!selectedCell) return { activeAcrossRun: null, activeDownRun: null };
    const [r, c] = selectedCell;
    const across =
      activePuzzle.runs.find(
        (run) =>
          run.direction === 'across' &&
          run.cells.some(([cr, cc]) => cr === r && cc === c)
      ) || null;
    const down =
      activePuzzle.runs.find(
        (run) =>
          run.direction === 'down' &&
          run.cells.some(([cr, cc]) => cr === r && cc === c)
      ) || null;
    return { activeAcrossRun: across, activeDownRun: down };
  }, [selectedCell, activePuzzle.runs]);

  // Set of all coordinates highlighted by current selection
  const highlightedRunCells = useMemo(() => {
    const set = new Set<string>();
    if (activeAcrossRun) {
      for (const [r, c] of activeAcrossRun.cells) set.add(`${r},${c}`);
    }
    if (activeDownRun) {
      for (const [r, c] of activeDownRun.cells) set.add(`${r},${c}`);
    }
    return set;
  }, [activeAcrossRun, activeDownRun]);

  // Set digit in selected cell
  const setDigit = useCallback(
    (digit: number | null) => {
      if (!selectedCell) return;
      const [r, c] = selectedCell;
      if (activePuzzle.grid[r]?.[c]?.type !== 'white') return;

      setUserGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = digit;
        return next;
      });
    },
    [selectedCell, activePuzzle.grid]
  );

  // Move selection to next white cell
  const moveToNextWhiteCell = useCallback(
    (dr: number, dc: number) => {
      if (!selectedCell) return;
      const [startR, startC] = selectedCell;
      let r = startR + dr;
      let c = startC + dc;

      while (r >= 0 && r < size && c >= 0 && c < size) {
        if (activePuzzle.grid[r]?.[c]?.type === 'white') {
          setSelectedCell([r, c]);
          return;
        }
        r += dr;
        c += dc;
      }
    },
    [selectedCell, size, activePuzzle.grid]
  );

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        setDigit(parseInt(e.key, 10));
      } else if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === '0' ||
        e.key === 'x'
      ) {
        e.preventDefault();
        setDigit(null);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveToNextWhiteCell(0, 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveToNextWhiteCell(0, -1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveToNextWhiteCell(1, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveToNextWhiteCell(-1, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDigit, moveToNextWhiteCell]);

  // Validation feedback
  const handleValidate = () => {
    if (isSolved) {
      setStatusMessage({
        type: 'success',
        text: '🎉 Puzzle Solved!',
        detail: 'All cross sums match and no duplicate digits exist.',
      });
      return;
    }

    if (duplicateCells.size > 0) {
      setStatusMessage({
        type: 'error',
        text: 'Duplicate Digits Detected',
        detail: 'Each run must contain unique digits between 1 and 9.',
      });
      return;
    }

    let incorrectFilledRuns = 0;
    for (const run of activePuzzle.runs) {
      const allFilled = run.cells.every(
        ([r, c]) => typeof userGrid[r]?.[c] === 'number'
      );
      if (allFilled && liveRunSums[run.id] !== run.targetSum) {
        incorrectFilledRuns++;
      }
    }

    if (incorrectFilledRuns > 0) {
      setStatusMessage({
        type: 'error',
        text: 'Sum Mismatch',
        detail: `${incorrectFilledRuns} filled run(s) do not equal target sum.`,
      });
      return;
    }

    setStatusMessage({
      type: 'idle',
      text: 'Looking good!',
      detail: 'Current entries are valid so far.',
    });
  };

  // Deliver to tablet
  const handleSendToRemarkable = async () => {
    const { token, repo, defaultDestination } = getStoredSettings();

    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Missing GitHub Token',
        detail:
          'Configure your Personal Access Token in Settings to deliver puzzles.',
      });
      onOpenSettings();
      return;
    }

    setIsBusy(true);
    setStatusMessage({
      type: 'dispatching',
      text: 'Triggering GitHub Actions workflow...',
      detail: `Kakuro ${size}×${size} (${difficulty})`,
    });

    try {
      const dispatchTimestamp = Date.now();
      await dispatchWorkflow({
        token,
        repo,
        inputs: {
          puzzle_type: 'kakuro',
          kakuro_size: String(size),
          kakuro_difficulty: difficulty,
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
          detail: `Kakuro ${size}×${size} (${difficulty}) uploaded successfully.`,
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

  const digitFontSize =
    size <= 6
      ? 'text-lg sm:text-xl'
      : size <= 8
      ? 'text-base sm:text-lg'
      : 'text-xs sm:text-sm font-bold';

  const clueFontSize =
    size <= 6
      ? 'text-[11px] sm:text-xs'
      : size <= 8
      ? 'text-[9px] sm:text-[10px]'
      : 'text-[7px] sm:text-[8px]';

  return (
    <div className="h-full flex flex-col justify-between max-w-md mx-auto p-3 safe-bottom select-none">
      {/* Top Header & Settings Controls */}
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-950 flex items-center space-x-1.5">
              <span>{activePuzzle.title}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                {size}×{size}
              </span>
            </h2>
            <p className="text-[11px] text-gray-500">
              Cross Sums with active run sum inspector
            </p>
          </div>

          {/* Size Pills */}
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
              title="Clear user digits"
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

        {/* Run Inspector Banner / Celebration Badge */}
        {isSolved ? (
          <div className="w-full bg-emerald-50 border border-emerald-300 rounded-lg px-2.5 py-1 text-xs text-emerald-950 flex items-center justify-between shadow-xs animate-fadeIn">
            <span className="font-bold flex items-center space-x-1 text-emerald-800">
              <span>🎉 Solved!</span>
              <span className="text-[11px] font-normal text-emerald-700">
                All cross sums match with unique digits.
              </span>
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
          </div>
        ) : (
          <div className="w-full bg-blue-50/70 border border-blue-200 rounded-lg px-2.5 py-1 text-xs text-blue-950 flex items-center justify-between shadow-xs min-h-[30px]">
            <div className="flex items-center space-x-2 truncate">
              {activeAcrossRun && (
                <div className="flex items-center space-x-1 shrink-0">
                  <span className="font-bold text-[10px] text-blue-800 bg-blue-100/90 border border-blue-200 px-1 py-0.2 rounded">
                    Across
                  </span>
                  <span className="text-[11px] font-semibold text-blue-950">
                    {liveRunSums[activeAcrossRun.id] ?? 0} /{' '}
                    <strong>{activeAcrossRun.targetSum}</strong>
                  </span>
                  {liveRunSums[activeAcrossRun.id] ===
                    activeAcrossRun.targetSum &&
                    activeAcrossRun.cells.every(
                      ([r, c]) => typeof userGrid[r]?.[c] === 'number'
                    ) && (
                      <span className="text-[10px] font-bold text-emerald-700">
                        ✓
                      </span>
                    )}
                </div>
              )}

              {activeAcrossRun && activeDownRun && (
                <span className="text-blue-300">•</span>
              )}

              {activeDownRun && (
                <div className="flex items-center space-x-1 shrink-0">
                  <span className="font-bold text-[10px] text-blue-800 bg-blue-100/90 border border-blue-200 px-1 py-0.2 rounded">
                    Down
                  </span>
                  <span className="text-[11px] font-semibold text-blue-950">
                    {liveRunSums[activeDownRun.id] ?? 0} /{' '}
                    <strong>{activeDownRun.targetSum}</strong>
                  </span>
                  {liveRunSums[activeDownRun.id] === activeDownRun.targetSum &&
                    activeDownRun.cells.every(
                      ([r, c]) => typeof userGrid[r]?.[c] === 'number'
                    ) && (
                      <span className="text-[10px] font-bold text-emerald-700">
                        ✓
                      </span>
                    )}
                </div>
              )}

              {!activeAcrossRun && !activeDownRun && (
                <span className="text-[11px] text-blue-600">
                  Select a white cell to inspect runs
                </span>
              )}
            </div>

            {duplicateCells.size > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1 bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                Duplicates!
              </span>
            )}
          </div>
        )}

        {/* Responsive Kakuro Grid */}
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
                  const cell = activePuzzle.grid[r]?.[c];
                  if (!cell) return null;

                  if (cell.type === 'block') {
                    return (
                      <div
                        key={`${r}-${c}`}
                        className="bg-gray-950 border border-gray-900"
                      />
                    );
                  }

                  if (cell.type === 'clue') {
                    return (
                      <div
                        key={`${r}-${c}`}
                        className="relative bg-gray-900 border border-gray-800 overflow-hidden flex items-center justify-center"
                      >
                        {/* Diagonal split line */}
                        <svg
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          preserveAspectRatio="none"
                          viewBox="0 0 100 100"
                        >
                          <line
                            x1="0"
                            y1="0"
                            x2="100"
                            y2="100"
                            stroke="#4b5563"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>

                        {/* Down clue (lower-left) */}
                        {cell.downSum !== undefined && (
                          <span
                            className={`absolute bottom-0.5 left-1 font-bold text-gray-300 leading-none select-none pointer-events-none ${clueFontSize}`}
                          >
                            {cell.downSum}
                          </span>
                        )}

                        {/* Across clue (upper-right) */}
                        {cell.acrossSum !== undefined && (
                          <span
                            className={`absolute top-0.5 right-1 font-bold text-gray-300 leading-none select-none pointer-events-none ${clueFontSize}`}
                          >
                            {cell.acrossSum}
                          </span>
                        )}
                      </div>
                    );
                  }

                  // White cell
                  const isSelected =
                    selectedCell &&
                    selectedCell[0] === r &&
                    selectedCell[1] === c;
                  const isInActiveRun = highlightedRunCells.has(`${r},${c}`);
                  const isDuplicate = duplicateCells.has(`${r},${c}`);
                  const userVal = userGrid[r]?.[c];
                  const solutionVal = cell.solution;
                  const displayVal = showSolution
                    ? solutionVal
                    : userVal ?? '';

                  let cellBg = 'bg-white';
                  if (isSelected) {
                    cellBg = 'bg-amber-100 ring-2 ring-inset ring-amber-500 z-10';
                  } else if (isDuplicate) {
                    cellBg = 'bg-rose-100 ring-1 ring-inset ring-rose-400';
                  } else if (isInActiveRun) {
                    cellBg = 'bg-blue-50/70';
                  }

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onClick={() => setSelectedCell([r, c])}
                      className={`relative flex items-center justify-center transition-colors cursor-pointer border border-gray-300 ${cellBg}`}
                    >
                      <span
                        className={`font-bold transition-all select-none ${digitFontSize} ${
                          showSolution
                            ? 'text-amber-800 font-extrabold'
                            : isDuplicate
                            ? 'text-rose-600 font-extrabold'
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
              <p className="text-[11px] text-gray-600 truncate mt-0.5">
                {statusMessage.detail}
              </p>
            )}
          </div>
        )}

        {/* Touch Numeric Keypad (1–9, Clear) */}
        <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-xs space-y-1.5">
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((num) => (
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
          <div className="grid grid-cols-5 gap-1.5">
            {[6, 7, 8, 9].map((num) => (
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
