import { useEffect } from 'react';
import { useIDEStore, type IDEView } from '@store/ideStore';

const viewKeys: Record<string, IDEView> = {
  '1': 'builder',
  '2': 'graph',
  '3': 'playground',
  '4': 'runs',
  '5': 'approvals',
  '6': 'evals',
  '7': 'versions',
  '8': 'policy',
  '9': 'memory',
};

export default function KeyboardShortcuts() {
  const setActiveView = useIDEStore((s) => s.setActiveView);
  const toggleSidebar = useIDEStore((s) => s.toggleSidebar);
  const toggleBottom = useIDEStore((s) => s.toggleBottom);
  const toggleInspector = useIDEStore((s) => s.toggleInspector);
  const openCommandPalette = useIDEStore((s) => s.openCommandPalette);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      const meta = e.metaKey || e.ctrlKey;

      if (!meta) return;

      // Cmd+K handled by CommandPalette itself

      // Cmd+Shift+P: Command palette (alt trigger)
      if (e.key === 'p' && e.shiftKey) {
        e.preventDefault();
        openCommandPalette();
        return;
      }

      // Cmd+Shift+I: Toggle inspector
      if (e.key === 'i' && e.shiftKey) {
        e.preventDefault();
        toggleInspector();
        return;
      }

      // Skip remaining shortcuts if in input
      if (isInput) return;

      // Cmd+1-7: Switch views
      if (viewKeys[e.key]) {
        e.preventDefault();
        setActiveView(viewKeys[e.key]);
        return;
      }

      // Cmd+B: Toggle sidebar
      if (e.key === 'b' && !e.shiftKey) {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Cmd+J: Toggle bottom panel
      if (e.key === 'j' && !e.shiftKey) {
        e.preventDefault();
        toggleBottom();
        return;
      }

      // Cmd+S: Save (prevent browser save, emit custom event)
      if (e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('ide:save'));
        return;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setActiveView, toggleSidebar, toggleBottom, toggleInspector, openCommandPalette]);

  return null;
}
