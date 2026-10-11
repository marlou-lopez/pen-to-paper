import React, { useState } from 'react';
import {
  Zap,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Layers,
  Sparkles,
  Calendar,
  Clock,
} from 'lucide-react';
import {
  getStoredSettings,
  dispatchWorkflow,
  pollWorkflowRun,
  WorkflowRun,
} from '../services/githubApi.ts';

interface DailyBundleProps {
  onOpenSettings: () => void;
}

const DIFFICULTIES = [
  { id: 'random', label: 'Random' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
  { id: 'expert', label: 'Expert' },
];

export const DailyBundle: React.FC<DailyBundleProps> = ({ onOpenSettings }) => {
  const [difficulty, setDifficulty] = useState('random');
  const [isBusy, setIsBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'idle' | 'running' | 'success' | 'error';
    text: string;
    detail?: string;
    runUrl?: string;
  }>({ type: 'idle', text: '' });

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const handleDeliverDaily = async () => {
    const { token, repo } = getStoredSettings();

    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'GitHub Token Not Configured',
        detail: 'Please configure your GitHub Fine-Grained PAT in Settings to trigger daily bundles.',
      });
      onOpenSettings();
      return;
    }

    setIsBusy(true);
    const dispatchTime = Date.now();

    setStatusMessage({
      type: 'running',
      text: "Dispatching Today's Puzzle Pack...",
      detail: `Connecting to ${repo} GitHub Actions...`,
    });

    try {
      await dispatchWorkflow({
        token,
        repo,
        inputs: {
          puzzle_type: 'all',
          sudoku_difficulty: difficulty,
          is_daily: true,
        },
      });

      setStatusMessage({
        type: 'running',
        text: 'Workflow queued on GitHub Actions...',
        detail: 'Generating Word Search and Sudoku PDFs for /Puzzles/Daily...',
      });

      const completedRun = await pollWorkflowRun(token, repo, {
        dispatchTimestamp: dispatchTime,
        timeoutMs: 180000,
        onUpdate: (run: WorkflowRun, elapsedSeconds: number) => {
          if (run.status === 'in_progress') {
            setStatusMessage({
              type: 'running',
              text: `Rendering & delivering bundle (${elapsedSeconds}s)...`,
              detail: 'Generating PDF vectors and uploading via rmapi...',
              runUrl: run.html_url,
            });
          }
        },
      });

      if (completedRun.conclusion === 'success') {
        setStatusMessage({
          type: 'success',
          text: "Today's Bundle Delivered!",
          detail: 'Word Search & Sudoku delivered to /Puzzles/Daily on your reMarkable.',
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
        text: 'Failed to Dispatch Daily Bundle',
        detail: msg,
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-950 flex items-center space-x-1.5">
          <span>Daily Puzzle Bundle</span>
        </h1>
        <p className="text-xs text-gray-500">1-tap delivery directly to your reMarkable tablet</p>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-gray-950 to-gray-800 text-white p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-medium text-gray-300">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{todayStr}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-700/80 text-gray-200">
            /Puzzles/Daily
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>Morning Delivery Pack</span>
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            Generates a curated daily Word Search with 22pt high-legibility typography and a fresh Sudoku puzzle, delivered straight to your reMarkable active inbox.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-700 text-xs">
          <div className="bg-gray-900/60 p-2.5 rounded-xl border border-gray-700/60">
            <p className="text-[11px] text-gray-400 font-medium">Included</p>
            <p className="font-semibold text-white mt-0.5 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              <span>Word Search</span>
            </p>
          </div>
          <div className="bg-gray-900/60 p-2.5 rounded-xl border border-gray-700/60">
            <p className="text-[11px] text-gray-400 font-medium">Included</p>
            <p className="font-semibold text-white mt-0.5 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sudoku</span>
            </p>
          </div>
        </div>
      </div>

      {/* Sudoku Difficulty Selection */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
          Sudoku Difficulty for Bundle
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDifficulty(d.id)}
              className={`py-2 px-1 text-xs font-medium rounded-lg text-center transition-all ${
                difficulty === d.id
                  ? 'bg-gray-950 text-white font-semibold shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Schedule Info */}
      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 flex items-start space-x-2.5">
        <Clock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-gray-800">Automated Schedule</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            GitHub Actions automatically triggers this bundle daily at 21:00 UTC (early morning in local time). Tap below anytime for immediate on-demand delivery.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={handleDeliverDaily}
          disabled={isBusy}
          className="w-full py-3.5 px-4 bg-gray-950 hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
        >
          {isBusy ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          )}
          <span>{isBusy ? 'Delivering...' : "Deliver Today's Bundle"}</span>
        </button>

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
