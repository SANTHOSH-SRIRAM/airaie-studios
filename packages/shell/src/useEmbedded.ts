/**
 * Detects whether the studio is embedded inside the platform via iframe.
 * Checks both `window.parent !== window` and `?embedded=true` query param.
 */
export function useEmbedded(): boolean {
  if (typeof window === 'undefined') return false;

  // Inside an iframe
  if (window.parent !== window) return true;

  // Query param fallback
  const params = new URLSearchParams(window.location.search);
  return params.get('embedded') === 'true';
}
