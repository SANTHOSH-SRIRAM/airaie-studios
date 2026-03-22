// ============================================================
// useKeyboardNav — Keyboard shortcuts for card detail page
// ============================================================
//
// Shortcuts:
//   Escape        — navigate back to board (D-12)
//   F             — toggle fullscreen canvas (collapse/expand properties panel) (D-13)
//   Cmd+Shift+F   — toggle fullscreen canvas (alternative binding)
//   Ctrl+Shift+F  — toggle fullscreen canvas (Windows/Linux)
//
// Arrow key tab navigation (D-11) is handled by @airaie/ui Tabs component's
// built-in keyboard roving (role="tab" + tabIndex + aria-selected).
// No additional code needed here for tab switching.
// ============================================================

import { useEffect } from 'react';

export interface UseKeyboardNavOptions {
  /** Called when Escape is pressed — typically navigate back to board */
  onEscape: () => void;
  /** Called when F or Cmd+Shift+F is pressed — toggle properties panel */
  onToggleFullscreen: () => void;
}

export function useKeyboardNav({ onEscape, onToggleFullscreen }: UseKeyboardNavOptions): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in input, textarea, or contenteditable element
      const target = e.target as HTMLElement;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
        return;
      }

      // F key (no modifiers), Space, or Cmd+Shift+F / Ctrl+Shift+F — toggle fullscreen
      if (
        (e.key === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) ||
        (e.key === ' ' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) ||
        (e.key === 'F' && (e.metaKey || e.ctrlKey) && e.shiftKey)
      ) {
        e.preventDefault();
        onToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onEscape, onToggleFullscreen]);
}
