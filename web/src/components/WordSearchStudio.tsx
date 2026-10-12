import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import {
  getStoredSettings,
  dispatchWorkflow,
  pollWorkflowRun,
  WorkflowRun,
} from '../services/githubApi.ts';

interface WordSearchStudioProps {
  onOpenSettings: () => void;
}

const CURATED_THEMES = [
  'Astronomy',
  'Ocean Life',
  'Ancient History',
  'Inventions',
  'World Geography',
  'Chemistry',
  'Architecture',
  'Musical Instruments',
  'Weather & Climate',
  'Forest Wildlife',
  'Board Games',
  'Botany',
  'Deep Space',
  'Minerals & Gems',
  'Aviation History',
];

export const WordSearchStudio: React.FC<WordSearchStudioProps> = ({ onOpenSettings }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('Astronomy');
  const [customTheme, setCustomTheme] = useState<string>('');

  const [isBusy, setIsBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'idle' | 'running' | 'success' | 'error';
    text: string;
    detail?: string;
    runUrl?: string;
  }>({ type: 'idle', text: '' });

  const activeTheme = customTheme.trim() ? customTheme.trim() : selectedPreset;

  const handleSelectPreset = (theme: string) => {
    setSelectedPreset(theme);
    setCustomTheme('');
  };

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

    if (!activeTheme) {
      setStatusMessage({
        type: 'error',
        text: 'No Theme Specified',
        detail: 'Please select a curated theme or type a custom theme.',
      });
      return;
    }

    setIsBusy(true);
    const dispatchTime = Date.now();

    setStatusMessage({
      type: 'running',
      text: `Dispatching "${activeTheme}" Word Search...`,
      detail: `Connecting to ${repo} GitHub Actions...`,
    });

    try {
      await dispatchWorkflow({
        token,
        repo,
        inputs: {
          puzzle_type: 'word-search',
          word_search_theme: activeTheme,
          is_daily: isDaily,
        },
      });

      setStatusMessage({
        type: 'running',
        text: 'Workflow queued on GitHub Actions...',
        detail: 'Generating 15x15 word search grid with 22pt high-contrast e-ink typography...',
      });

      const completedRun = await pollWorkflowRun(token, repo, {
        dispatchTimestamp: dispatchTime,
        timeoutMs: 180000,
        onUpdate: (run: WorkflowRun, elapsedSeconds: number) => {
          if (run.status === 'in_progress') {
            setStatusMessage({
              type: 'running',
              text: `Generating & uploading to reMarkable (${elapsedSeconds}s)...`,
              detail: `Building "${activeTheme}" puzzle PDF...`,
              runUrl: run.html_url,
            });
          }
        },
      });

      if (completedRun.conclusion === 'success') {
        setStatusMessage({
          type: 'success',
          text: `Delivered "${activeTheme}" Word Search!`,
          detail: `Uploaded to ${isDaily ? '/Puzzles/Daily/' : '/Puzzles/Word Search/'}. Sync your reMarkable to play!`,
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
    <div className="max-w-md mx-auto px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-950 flex items-center space-x-1.5">
          <span>Word Search Studio</span>
        </h1>
        <p className="text-xs text-gray-500">
          Curated or AI-powered dynamic themes with 22pt e-ink typography
        </p>
      </div>

      {/* Custom Theme Input */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-xs space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 flex items-center justify-between">
          <span>Custom Dynamic Theme</span>
          <span className="text-[10px] text-gray-400 font-normal">Optional</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={customTheme}
            onChange={(e) => setCustomTheme(e.target.value)}
            placeholder="e.g. Cyberpunk, Ancient Egypt, Jazz Classics..."
            className="w-full px-3.5 py-2 sm:py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <p className="text-[11px] text-gray-500">
          Custom themes fetch related words via the Datamuse vocabulary API.
        </p>
      </div>

      {/* Curated Presets */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-xs space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-700 flex items-center space-x-1">
            <BookOpen className="w-3.5 h-3.5 text-gray-500" />
            <span>Curated Theme Presets</span>
          </h2>
          <span className="text-[11px] text-gray-400">Instant generation</span>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-40 sm:max-h-48 overflow-y-auto pr-1">
          {CURATED_THEMES.map((theme) => {
            const isSelected = !customTheme.trim() && selectedPreset === theme;
            return (
              <button
                key={theme}
                type="button"
                onClick={() => handleSelectPreset(theme)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
      </div>

      {/* Selected Theme Display & Send Action */}
      <div className="space-y-2.5 sm:space-y-3 pt-0.5">
        <div className="p-2.5 sm:p-3 bg-gray-100/80 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
          <span className="text-gray-500">Active Theme:</span>
          <span className="font-bold text-gray-950 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{activeTheme}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleSendToRemarkable}
          disabled={isBusy || !activeTheme}
          className="w-full py-3 sm:py-3.5 px-4 bg-gray-950 hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
        >
          {isBusy ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
          <span>{isBusy ? 'Delivering...' : 'Send to reMarkable'}</span>
        </button>

        {/* Live Status Banner */}
        {statusMessage.text && (
          <div
            className={`p-3 rounded-xl border text-xs space-y-1 ${
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
