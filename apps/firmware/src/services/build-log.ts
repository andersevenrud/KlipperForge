type LogListener = (line: string) => void;

const LOG_RETENTION_MS = 5 * 60 * 1000; // 5 minutes after last write

const listeners = new Map<string, Set<LogListener>>();
const logs = new Map<string, string[]>();
const logTimestamps = new Map<string, number>();

export function appendLog(jobId: string, line: string): void {
  const trimmed = line.trimEnd();
  if (!trimmed) return;

  const jobLogs = logs.get(jobId) ?? [];
  if (!logs.has(jobId)) {
    logs.set(jobId, jobLogs);
  }
  jobLogs.push(trimmed);
  logTimestamps.set(jobId, Date.now());

  const jobListeners = listeners.get(jobId);
  if (jobListeners) {
    for (const listener of jobListeners) {
      listener(trimmed);
    }
  }
}

export function getLog(jobId: string): string[] {
  return logs.get(jobId) ?? [];
}

function clearLog(jobId: string): void {
  logs.delete(jobId);
  logTimestamps.delete(jobId);
}

export function cleanupStaleLogs(): void {
  const cutoff = Date.now() - LOG_RETENTION_MS;
  for (const [jobId, timestamp] of logTimestamps) {
    if (timestamp < cutoff) {
      logs.delete(jobId);
      logTimestamps.delete(jobId);
      listeners.delete(jobId);
    }
  }
}

export function subscribe(jobId: string, listener: LogListener): () => void {
  const jobListeners = listeners.get(jobId) ?? new Set<LogListener>();
  if (!listeners.has(jobId)) {
    listeners.set(jobId, jobListeners);
  }
  jobListeners.add(listener);

  return () => {
    const jobListeners = listeners.get(jobId);
    if (jobListeners) {
      jobListeners.delete(listener);
      if (jobListeners.size === 0) {
        listeners.delete(jobId);
      }
    }
  };
}
