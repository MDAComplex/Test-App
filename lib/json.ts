// Guarded JSON.parse for SQLite-stored JSON columns (categoryWeights,
// tagWeights, budgetRange, styleVibes, event metadata, ...). A single
// malformed/legacy row must never blow up a request path, so every parse in
// the feed/preferences/onboarding code goes through this and falls back to a
// caller-supplied default.
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}
