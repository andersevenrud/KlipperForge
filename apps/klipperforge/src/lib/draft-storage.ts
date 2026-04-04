const DRAFT_KEY = "klipperforge:draft";

interface DraftData {
  document: string;
  configId: string | null;
  configName: string | null;
  currentRevision: number | null;
  savedAt: string;
}

export function saveDraft(data: DraftData): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

export function loadDraft(): DraftData | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftData;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // silently ignore
  }
}
