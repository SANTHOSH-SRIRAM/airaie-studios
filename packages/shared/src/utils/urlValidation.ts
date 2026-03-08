/**
 * Validate that a URL is safe to open via window.open().
 * Prevents open-redirect attacks from API-provided or dynamically-built URLs.
 *
 * @param url - The URL to validate
 * @param allowedOrigins - Explicit list of trusted origins (e.g., studio URLs).
 *   Defaults to current window origin.
 */
export function isSafeUrl(url: string, allowedOrigins?: string[]): boolean {
  // Blank URLs (PDF export uses window.open('', '_blank'))
  if (!url) return true;

  // Relative URLs are always safe
  if (url.startsWith('/')) return true;

  try {
    const parsed = new URL(url);

    // Only allow http(s) protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

    const origins = allowedOrigins ?? [window.location.origin];
    return origins.some((o) => {
      try {
        return new URL(o).origin === parsed.origin;
      } catch {
        return o === parsed.origin;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Safely open a URL, logging a warning and blocking navigation if the URL
 * doesn't match the allowed origins.
 */
export function safeOpen(
  url: string,
  target: string,
  allowedOrigins?: string[]
): Window | null {
  if (!isSafeUrl(url, allowedOrigins)) {
    console.warn('[safeOpen] Blocked navigation to untrusted URL:', url);
    return null;
  }
  return window.open(url, target);
}
