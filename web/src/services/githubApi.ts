export interface DispatchOptions {
  token: string;
  repo: string; // e.g. "marlou-lopez/pen-to-paper"
  ref?: string; // e.g. "main"
  inputs: {
    puzzle_type: 'all' | 'sudoku' | 'word-search' | 'mini-crossword';
    sudoku_difficulty?: string;
    sudoku_grid?: string;
    word_search_theme?: string;
    crossword_theme?: string;
    is_daily?: boolean;
  };
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed' | string;
  conclusion: 'success' | 'failure' | 'cancelled' | 'timed_out' | string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRunsResponse {
  total_count: number;
  workflow_runs: WorkflowRun[];
}

export interface StoredSettings {
  token: string;
  repo: string;
  defaultDestination?: 'category' | 'daily';
}

const SETTINGS_KEY = 'pen_to_paper_settings';
export const DEFAULT_REPO = 'marlou-lopez/pen-to-paper';

export function getStoredSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        token: parsed.token || '',
        repo: parsed.repo || DEFAULT_REPO,
        defaultDestination: parsed.defaultDestination === 'daily' ? 'daily' : 'category',
      };
    }
  } catch {
    // fallback
  }
  return {
    token: '',
    repo: DEFAULT_REPO,
    defaultDestination: 'category',
  };
}

export function saveStoredSettings(settings: StoredSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Validates a GitHub PAT by requesting repo details.
 */
export async function testConnection(
  token: string,
  repo: string
): Promise<{ ok: boolean; repoName?: string; error?: string }> {
  const cleanRepo = repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
  const cleanToken = token.trim();

  if (!cleanToken) {
    return { ok: false, error: 'Personal Access Token cannot be blank.' };
  }
  if (!cleanRepo || !cleanRepo.includes('/')) {
    return { ok: false, error: 'Repository must be in "owner/repo" format.' };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        return { ok: false, error: 'Invalid or expired GitHub Token (401 Unauthorized).' };
      }
      if (res.status === 404) {
        return { ok: false, error: `Repository "${cleanRepo}" not found or token lacks access (404 Not Found).` };
      }
      const errText = await res.text();
      return { ok: false, error: `GitHub API error (${res.status}): ${errText}` };
    }

    const data = await res.json();
    return { ok: true, repoName: data.full_name };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Connection failed: ${message}` };
  }
}

/**
 * Dispatches the daily-puzzles.yml workflow via GitHub REST API.
 */
export async function dispatchWorkflow(opts: DispatchOptions): Promise<void> {
  const cleanRepo = opts.repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
  const cleanToken = opts.token.trim();

  if (!cleanToken) {
    throw new Error('GitHub PAT is required. Please set it in Settings.');
  }

  const url = `https://api.github.com/repos/${cleanRepo}/actions/workflows/daily-puzzles.yml/dispatches`;

  const payload = {
    ref: opts.ref || 'main',
    inputs: {
      puzzle_type: opts.inputs.puzzle_type,
      sudoku_difficulty: opts.inputs.sudoku_difficulty || 'random',
      sudoku_grid: opts.inputs.sudoku_grid || '',
      word_search_theme: opts.inputs.word_search_theme || '',
      crossword_theme: opts.inputs.crossword_theme || '',
      is_daily: String(opts.inputs.is_daily !== false),
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorDetail = '';
    try {
      const errJson = await res.json();
      errorDetail = errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(`Dispatch failed (${res.status}): ${errorDetail}`);
  }
}

/**
 * Polls for workflow runs of daily-puzzles.yml until completion or timeout.
 */
export async function pollWorkflowRun(
  token: string,
  repo: string,
  options?: {
    dispatchTimestamp?: number;
    timeoutMs?: number;
    pollIntervalMs?: number;
    onUpdate?: (run: WorkflowRun, elapsedSeconds: number) => void;
  }
): Promise<WorkflowRun> {
  const cleanRepo = repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
  const cleanToken = token.trim();
  const startTime = options?.dispatchTimestamp || Date.now();
  const timeoutMs = options?.timeoutMs || 180000; // 3 minutes timeout
  const pollIntervalMs = options?.pollIntervalMs || 3000;

  const url = `https://api.github.com/repos/${cleanRepo}/actions/workflows/daily-puzzles.yml/runs?per_page=5`;

  let runId: number | null = null;

  while (Date.now() - startTime < timeoutMs) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!res.ok) {
        continue;
      }

      const data: WorkflowRunsResponse = await res.json();
      if (!data.workflow_runs || data.workflow_runs.length === 0) {
        continue;
      }

      let currentRun: WorkflowRun | undefined;

      if (runId !== null) {
        currentRun = data.workflow_runs.find((r) => r.id === runId);
      } else {
        // Find run created right around or after our dispatch
        // Filter out completed runs that were created before our dispatch to avoid matching previous executions
        const targetRuns = data.workflow_runs.filter((r) => {
          const runTime = new Date(r.created_at).getTime();
          if (r.status === 'completed' && runTime <= startTime) {
            return false;
          }
          return runTime >= startTime - 15000;
        });

        if (targetRuns.length > 0) {
          currentRun = targetRuns[0];
          runId = currentRun.id;
        }
      }

      if (currentRun) {
        if (options?.onUpdate) {
          options.onUpdate(currentRun, elapsedSeconds);
        }

        if (currentRun.status === 'completed') {
          return currentRun;
        }
      }
    } catch {
      // transient network error, retry
    }
  }

  throw new Error(`Polling timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
}
