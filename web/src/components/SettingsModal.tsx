import React, { useState, useEffect } from 'react';
import { X, Key, GitBranch, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import {
  getStoredSettings,
  saveStoredSettings,
  testConnection,
  DEFAULT_REPO,
} from '../services/githubApi.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [defaultDestination, setDefaultDestination] = useState<'category' | 'daily'>('category');
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok?: boolean;
    repoName?: string;
    error?: string;
  } | null>(null);
  const [saveMessage, setSaveMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredSettings();
      setToken(stored.token);
      setRepo(stored.repo || DEFAULT_REPO);
      setDefaultDestination(stored.defaultDestination || 'category');
      setTestResult(null);
      setSaveMessage(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection(token, repo);
      setTestResult(res);
    } catch (err: unknown) {
      setTestResult({
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown connection error',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    saveStoredSettings({
      token: token.trim(),
      repo: repo.trim(),
      defaultDestination,
    });
    setSaveMessage(true);
    setTimeout(() => {
      setSaveMessage(false);
      if (onSettingsSaved) onSettingsSaved();
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gray-900 text-white rounded-lg">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">GitHub Settings</h2>
              <p className="text-xs text-gray-500">Configure PAT for dispatching workflows</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* GitHub Token */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Personal Access Token (PAT)
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="github_pat_... or ghp_..."
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono text-xs pr-16"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-gray-500 hover:text-gray-800 font-medium"
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 leading-normal">
              Stored exclusively in your browser&apos;s local storage. Requires{' '}
              <span className="font-semibold text-gray-700">Actions: Read and Write</span> permission.
            </p>
          </div>

          {/* Repository */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 flex items-center justify-between">
              <span>Target Repository</span>
              <span className="text-[10px] text-gray-400 font-normal">owner/repo</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <GitBranch className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="marlou-lopez/pen-to-paper"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono text-xs"
              />
            </div>
          </div>

          {/* Connection Test Result */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
                testResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {testResult.ok ? 'Connection Verified' : 'Connection Failed'}
                </p>
                <p className="mt-0.5 text-[11px]">
                  {testResult.ok
                    ? `Successfully authenticated with ${testResult.repoName}. Ready to dispatch.`
                    : testResult.error}
                </p>
              </div>
            </div>
          )}

          {/* Help note */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
            <p className="font-medium text-gray-800 flex items-center space-x-1">
              <span>How to create a Fine-Grained PAT:</span>
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-gray-500 pl-1">
              <li>GitHub Settings &gt; Developer Settings &gt; Personal access tokens.</li>
              <li>Select <strong>Fine-grained tokens</strong> &gt; Generate new token.</li>
              <li>Repository access: <strong>Only select repositories</strong> &gt; choose repo.</li>
              <li>Repository permissions: <strong>Actions (Read and Write)</strong>.</li>
            </ol>
            <a
              href="https://github.com/settings/tokens?type=beta"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium pt-1 text-[11px]"
            >
              <span>Open GitHub Token Settings</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>

          {/* Default Delivery Destination */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Default Delivery Destination
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDefaultDestination('category')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  defaultDestination === 'category'
                    ? 'border-gray-950 bg-gray-50 text-gray-950 font-semibold ring-1 ring-gray-950'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="text-xs font-bold">Category Folders</div>
                <div className="text-[10px] text-gray-400 mt-0.5 font-mono">/Puzzles/&lt;Category&gt;/</div>
              </button>

              <button
                type="button"
                onClick={() => setDefaultDestination('daily')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  defaultDestination === 'daily'
                    ? 'border-gray-950 bg-gray-50 text-gray-950 font-semibold ring-1 ring-gray-950'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="text-xs font-bold">Daily Inbox</div>
                <div className="text-[10px] text-gray-400 mt-0.5 font-mono">/Puzzles/Daily/</div>
              </button>
            </div>
            <p className="text-[11px] text-gray-500">
              Determines where custom and on-demand puzzles are routed on your reMarkable tablet.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between space-x-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !token}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-1.5 shadow-sm"
          >
            {testing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{testing ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 max-w-[140px] px-4 py-2 text-xs font-semibold text-white bg-gray-900 rounded-xl hover:bg-black transition-all shadow-sm active:scale-95"
          >
            {saveMessage ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
