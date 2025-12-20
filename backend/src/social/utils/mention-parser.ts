export function extractMentions(text: string): string[] {
  if (!text) return [];

  // Remove email addresses to avoid false positives
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const sanitized = text.replace(emailPattern, '');

  // Match @username with word boundaries; emails already removed
  const mentionRegex = /@([A-Za-z0-9_]{2,30})\b/g;
  const found: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = mentionRegex.exec(sanitized)) !== null) {
    const username = match[1];
    const normalized = username.replace(/^_+|_+$/g, '');
    if (normalized.length < 2) continue;
    const lower = normalized.toLowerCase();
    if (!found.includes(lower)) {
      found.push(lower);
    }
  }
  return found;
}

export function snippetAround(
  text: string,
  username: string,
  radius = 30,
): string {
  if (!text) return '';
  const idx = text.toLowerCase().indexOf('@' + username.toLowerCase());
  if (idx < 0) return '';
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + username.length + 1 + radius);
  return text.substring(start, end).trim();
}
