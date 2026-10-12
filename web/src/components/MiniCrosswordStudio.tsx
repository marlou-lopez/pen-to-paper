import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import {
  getStoredSettings,
  dispatchWorkflow,
  pollWorkflowRun,
  WorkflowRun,
} from '../services/githubApi.ts';

export interface MiniCrosswordStudioProps {
  onOpenSettings: () => void;
}

export interface SampleClue {
  number: number;
  direction: 'across' | 'down';
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  length: number;
}

export interface SampleCrossword {
  title: string;
  grid: string[][];
  acrossClues: SampleClue[];
  downClues: SampleClue[];
}

const SAMPLE_PUZZLES: SampleCrossword[] = [
  {
    title: 'Heart & Soul',
    grid: [
      ['H', 'E', 'A', 'R', 'T'],
      ['E', 'M', 'B', 'E', 'R'],
      ['A', 'B', 'U', 'S', 'E'],
      ['R', 'E', 'S', 'I', 'N'],
      ['T', 'R', 'E', 'N', 'D'],
    ],
    acrossClues: [
      { number: 1, direction: 'across', word: 'HEART', clue: 'Vital muscular organ pumping blood', startRow: 0, startCol: 0, length: 5 },
      { number: 6, direction: 'across', word: 'EMBER', clue: 'Glowing piece of burning coal or wood', startRow: 1, startCol: 0, length: 5 },
      { number: 7, direction: 'across', word: 'ABUSE', clue: 'Cruel or improper treatment', startRow: 2, startCol: 0, length: 5 },
      { number: 8, direction: 'across', word: 'RESIN', clue: 'Sticky organic fluid from pine trees', startRow: 3, startCol: 0, length: 5 },
      { number: 9, direction: 'across', word: 'TREND', clue: 'General direction in which things are developing', startRow: 4, startCol: 0, length: 5 },
    ],
    downClues: [
      { number: 1, direction: 'down', word: 'HEART', clue: 'Center or core of an emotional issue', startRow: 0, startCol: 0, length: 5 },
      { number: 2, direction: 'down', word: 'EMBER', clue: 'Smoldering remnant of a dying campfire', startRow: 0, startCol: 1, length: 5 },
      { number: 3, direction: 'down', word: 'ABUSE', clue: 'Excessive or corrupt misuse of authority', startRow: 0, startCol: 2, length: 5 },
      { number: 4, direction: 'down', word: 'RESIN', clue: 'Tree secretion used in varnishes', startRow: 0, startCol: 3, length: 5 },
      { number: 5, direction: 'down', word: 'TREND', clue: 'Popular style or viral topic online', startRow: 0, startCol: 4, length: 5 },
    ],
  },
  {
    title: 'Standing Firm',
    grid: [
      ['S', 'T', 'A', 'N', 'D'],
      ['T', 'A', 'B', 'O', 'O'],
      ['A', 'B', 'B', 'O', 'T'],
      ['N', 'O', 'O', 'S', 'E'],
      ['D', 'O', 'T', 'E', 'D'],
    ],
    acrossClues: [
      { number: 1, direction: 'across', word: 'STAND', clue: "Remain upright on one's feet", startRow: 0, startCol: 0, length: 5 },
      { number: 6, direction: 'across', word: 'TABOO', clue: 'Prohibited by social custom or religion', startRow: 1, startCol: 0, length: 5 },
      { number: 7, direction: 'across', word: 'ABBOT', clue: 'Head of a community of monks', startRow: 2, startCol: 0, length: 5 },
      { number: 8, direction: 'across', word: 'NOOSE', clue: 'Loop with a running knot for hanging', startRow: 3, startCol: 0, length: 5 },
      { number: 9, direction: 'across', word: 'DOTED', clue: 'Showed excessive affection or fondness', startRow: 4, startCol: 0, length: 5 },
    ],
    downClues: [
      { number: 1, direction: 'down', word: 'STAND', clue: 'Take an assertive position on a dispute', startRow: 0, startCol: 0, length: 5 },
      { number: 2, direction: 'down', word: 'TABOO', clue: 'Forbidden topic or off-limits practice', startRow: 0, startCol: 1, length: 5 },
      { number: 3, direction: 'down', word: 'ABBOT', clue: 'Monastic leader in a priory', startRow: 0, startCol: 2, length: 5 },
      { number: 4, direction: 'down', word: 'NOOSE', clue: 'Rope trap or slipknot fastener', startRow: 0, startCol: 3, length: 5 },
      { number: 5, direction: 'down', word: 'DOTED', clue: 'Lavished unconditional love upon', startRow: 0, startCol: 4, length: 5 },
    ],
  },
  {
    title: 'Morning Clouds',
    grid: [
      ['C', 'L', 'O', 'U', 'D'],
      ['L', 'E', 'A', 'S', 'E'],
      ['O', 'A', 'K', 'E', 'N'],
      ['U', 'S', 'E', 'R', 'S'],
      ['D', 'E', 'N', 'S', 'E'],
    ],
    acrossClues: [
      { number: 1, direction: 'across', word: 'CLOUD', clue: 'Visible mass of condensed water vapor', startRow: 0, startCol: 0, length: 5 },
      { number: 6, direction: 'across', word: 'LEASE', clue: 'Contract granting land or property use', startRow: 1, startCol: 0, length: 5 },
      { number: 7, direction: 'across', word: 'OAKEN', clue: 'Made from hardwood of the genus Quercus', startRow: 2, startCol: 0, length: 5 },
      { number: 8, direction: 'across', word: 'USERS', clue: 'People operating a software system', startRow: 3, startCol: 0, length: 5 },
      { number: 9, direction: 'across', word: 'DENSE', clue: 'Closely compacted in substance or crowded', startRow: 4, startCol: 0, length: 5 },
    ],
    downClues: [
      { number: 1, direction: 'down', word: 'CLOUD', clue: 'Vapor gathering before precipitation', startRow: 0, startCol: 0, length: 5 },
      { number: 2, direction: 'down', word: 'LEASE', clue: 'Rental agreement between tenant and landlord', startRow: 0, startCol: 1, length: 5 },
      { number: 3, direction: 'down', word: 'OAKEN', clue: 'Crafted from sturdy oak timber', startRow: 0, startCol: 2, length: 5 },
      { number: 4, direction: 'down', word: 'USERS', clue: 'Subscribers utilizing an application', startRow: 0, startCol: 3, length: 5 },
      { number: 5, direction: 'down', word: 'DENSE', clue: 'Thickly packed with trees or foliage', startRow: 0, startCol: 4, length: 5 },
    ],
  },
  {
    title: 'Royal North',
    grid: [
      ['C', 'R', 'O', 'W', 'N'],
      ['R', 'E', 'T', 'R', 'O'],
      ['O', 'T', 'H', 'E', 'R'],
      ['W', 'R', 'E', 'S', 'T'],
      ['N', 'O', 'R', 'T', 'H'],
    ],
    acrossClues: [
      { number: 1, direction: 'across', word: 'CROWN', clue: 'Ornamental circular headdress of monarchs', startRow: 0, startCol: 0, length: 5 },
      { number: 6, direction: 'across', word: 'RETRO', clue: 'Imitative of past styles and fashions', startRow: 1, startCol: 0, length: 5 },
      { number: 7, direction: 'across', word: 'OTHER', clue: 'Different from one previously mentioned', startRow: 2, startCol: 0, length: 5 },
      { number: 8, direction: 'across', word: 'WREST', clue: "Forcibly pull or tear from someone's grasp", startRow: 3, startCol: 0, length: 5 },
      { number: 9, direction: 'across', word: 'NORTH', clue: 'Compass direction pointing to the pole', startRow: 4, startCol: 0, length: 5 },
    ],
    downClues: [
      { number: 1, direction: 'down', word: 'CROWN', clue: 'Peak or highest point of an arch or hill', startRow: 0, startCol: 0, length: 5 },
      { number: 2, direction: 'down', word: 'RETRO', clue: 'Vintage aesthetic looking back in time', startRow: 0, startCol: 1, length: 5 },
      { number: 3, direction: 'down', word: 'OTHER', clue: 'Alternative person or option', startRow: 0, startCol: 2, length: 5 },
      { number: 4, direction: 'down', word: 'WREST', clue: 'Snatch or wrench away with effort', startRow: 0, startCol: 3, length: 5 },
      { number: 5, direction: 'down', word: 'NORTH', clue: 'Direction opposite to south on a map', startRow: 0, startCol: 4, length: 5 },
    ],
  },
  {
    title: 'Sweet Dreams',
    grid: [
      ['D', 'R', 'E', 'A', 'M'],
      ['R', 'E', 'T', 'R', 'O'],
      ['E', 'T', 'H', 'E', 'R'],
      ['A', 'R', 'E', 'N', 'A'],
      ['M', 'O', 'R', 'A', 'L'],
    ],
    acrossClues: [
      { number: 1, direction: 'across', word: 'DREAM', clue: 'Series of thoughts and visions during sleep', startRow: 0, startCol: 0, length: 5 },
      { number: 6, direction: 'across', word: 'RETRO', clue: 'Nostalgic design reminiscent of the past', startRow: 1, startCol: 0, length: 5 },
      { number: 7, direction: 'across', word: 'ETHER', clue: 'Volatile liquid once used as an anesthetic', startRow: 2, startCol: 0, length: 5 },
      { number: 8, direction: 'across', word: 'ARENA', clue: 'Level area surrounded by seating for sports', startRow: 3, startCol: 0, length: 5 },
      { number: 9, direction: 'across', word: 'MORAL', clue: 'Lesson or ethical principle from a fable', startRow: 4, startCol: 0, length: 5 },
    ],
    downClues: [
      { number: 1, direction: 'down', word: 'DREAM', clue: 'Cherished hope, ambition, or slumber fantasy', startRow: 0, startCol: 0, length: 5 },
      { number: 2, direction: 'down', word: 'RETRO', clue: 'Throwback fashion or vintage pop style', startRow: 0, startCol: 1, length: 5 },
      { number: 3, direction: 'down', word: 'ETHER', clue: 'Upper air or classical element of the heavens', startRow: 0, startCol: 2, length: 5 },
      { number: 4, direction: 'down', word: 'ARENA', clue: 'Stadium setting for contests or gladiators', startRow: 0, startCol: 3, length: 5 },
      { number: 5, direction: 'down', word: 'MORAL', clue: 'Concerned with principles of right and wrong', startRow: 0, startCol: 4, length: 5 },
    ],
  },
];

const PRESET_THEMES = ['Daily', 'Astronomy', 'Nature', 'Ocean', 'History'];

const CELL_CLUE_NUMBERS: Record<string, number> = {
  '0,0': 1,
  '0,1': 2,
  '0,2': 3,
  '0,3': 4,
  '0,4': 5,
  '1,0': 6,
  '2,0': 7,
  '3,0': 8,
  '4,0': 9,
};

export const MiniCrosswordStudio: React.FC<MiniCrosswordStudioProps> = ({ onOpenSettings }) => {
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>([0, 0]);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [sampleIndex, setSampleIndex] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<string>('Daily');
  const [customTheme, setCustomTheme] = useState<string>('');

  const [isBusy, setIsBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'idle' | 'running' | 'success' | 'error';
    text: string;
    detail?: string;
    runUrl?: string;
  }>({ type: 'idle', text: '' });

  const activeTheme = customTheme.trim() ? customTheme.trim() : selectedPreset;
  const currentPuzzle = SAMPLE_PUZZLES[sampleIndex];

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
  }, [activeClueIndex]);

  // Toggle direction or select cell
  const handleCellClick = (r: number, c: number) => {
    if (selectedCell && selectedCell[0] === r && selectedCell[1] === c) {
      setDirection((d) => (d === 'across' ? 'down' : 'across'));
    } else {
      setSelectedCell([r, c]);
    }
  };

  const handleToggleDirection = () => {
    setDirection((d) => (d === 'across' ? 'down' : 'across'));
  };

  const handleCycleSample = () => {
    setSampleIndex((prev) => (prev + 1) % SAMPLE_PUZZLES.length);
    setSelectedCell([0, 0]);
  };

  const handleSelectPreset = (preset: string) => {
    setSelectedPreset(preset);
    setCustomTheme('');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, handlePrevClue, handleNextClue]);

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
      {/* Top Section */}
      <div className="w-full flex flex-col items-center space-y-2">
        {/* Utility Subheader */}
        <div className="w-full flex items-center justify-between text-xs px-1 text-gray-600">
          <div className="flex items-center space-x-1.5">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-800 border border-gray-200">
              Theme: {activeTheme}
            </span>
            <span className="text-[10px] text-gray-400 font-mono hidden min-[380px]:inline">
              #{sampleIndex + 1}/{SAMPLE_PUZZLES.length}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
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
                row.map((char, c) => {
                  const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
                  const isSameWord =
                    selectedCell &&
                    (direction === 'across' ? selectedCell[0] === r : selectedCell[1] === c);
                  const clueNum = CELL_CLUE_NUMBERS[`${r},${c}`];

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
                      <span className="text-xl font-bold uppercase select-none">{char}</span>
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
