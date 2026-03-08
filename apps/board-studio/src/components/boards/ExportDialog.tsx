// ============================================================
// ExportDialog — PDF/JSON/CSV export dialog with Modal
// ============================================================

import React, { useState, useCallback } from 'react';
import { FileText, Braces, Sheet, Download, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Modal, Card, Button, Spinner } from '@airaie/ui';
import axios from 'axios';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import { fetchBoard, fetchBoardSummary } from '@api/boards';
import { fetchCards } from '@api/cards';
import { fetchGates } from '@api/gates';
import type { Board, BoardSummary, Card as CardType, Gate } from '@/types/board';

export interface ExportDialogProps {
  boardId: string;
  open: boolean;
  onClose: () => void;
}

type ExportFormat = 'pdf' | 'json' | 'csv';

interface FormatOption {
  id: ExportFormat;
  icon: LucideIcon;
  label: string;
  description: string;
}

const formatOptions: FormatOption[] = [
  {
    id: 'pdf',
    icon: FileText,
    label: 'PDF Report',
    description: 'Full board report with readiness, gates, evidence',
  },
  {
    id: 'json',
    icon: Braces,
    label: 'JSON Data Pack',
    description: 'Machine-readable board data for integration',
  },
  {
    id: 'csv',
    icon: Sheet,
    label: 'CSV Spreadsheet',
    description: 'Tabular data for spreadsheet analysis',
  },
];

/**
 * Trigger browser file download from a Blob.
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert board data to CSV format.
 */
function boardDataToCsv(data: {
  board: Board & { summary?: BoardSummary | null };
  cards: CardType[];
  gates: Gate[];
}): string {
  const lines: string[] = [];

  // Board info
  lines.push('Section,Field,Value');
  lines.push(`Board,Name,${csvEscape(String(data.board.name ?? ''))}`);
  lines.push(`Board,Mode,${csvEscape(String(data.board.mode ?? ''))}`);
  lines.push(`Board,Status,${csvEscape(String(data.board.status ?? ''))}`);
  lines.push(`Board,Type,${csvEscape(String(data.board.type ?? ''))}`);
  lines.push(`Board,Readiness,${data.board.readiness ?? 0}`);
  lines.push('');

  // Cards
  lines.push('Card Name,Type,Status,Ordinal');
  for (const card of data.cards) {
    lines.push(
      `${csvEscape(String(card.name ?? ''))},${card.type ?? ''},${card.status ?? ''},${card.ordinal ?? 0}`
    );
  }
  lines.push('');

  // Gates
  lines.push('Gate Name,Type,Status,Requirements Count');
  for (const gate of data.gates) {
    const reqCount = gate.requirements?.length ?? 0;
    lines.push(
      `${csvEscape(String(gate.name ?? ''))},${gate.type ?? ''},${gate.status ?? ''},${reqCount}`
    );
  }

  return lines.join('\n');
}

/** Escape user-supplied text for safe HTML injection */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// --- Main component ---

const ExportDialog: React.FC<ExportDialogProps> = ({
  boardId,
  open,
  onClose,
}) => {
  const [selected, setSelected] = useState<ExportFormat>('json');
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setMessage(null);
    setSuccess(false);

    try {
      // Try the backend export endpoint first
      const response = await axios.post(
        KERNEL_ENDPOINTS.BOARDS.EXPORT(boardId),
        { format: selected },
        { responseType: 'blob' }
      );

      const ext = selected === 'pdf' ? 'pdf' : selected === 'csv' ? 'csv' : 'json';
      downloadBlob(response.data, `board-${boardId}.${ext}`);
      setSuccess(true);
      setMessage('Export downloaded successfully.');
    } catch (err: unknown) {
      // Check for 404 — backend endpoint not yet available
      const is404 =
        axios.isAxiosError(err) && err.response?.status === 404;

      if (!is404) {
        // Unexpected error for non-404
        setMessage(
          `Export failed: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`
        );
        setExporting(false);
        return;
      }

      // Fallback: client-side export (including PDF via print dialog)
      if (selected === 'pdf') {
        try {
          const [board, summary, cards, gates] = await Promise.all([
            fetchBoard(boardId),
            fetchBoardSummary(boardId).catch(() => null),
            fetchCards(boardId).catch(() => []),
            fetchGates(boardId).catch(() => []),
          ]);
          // Generate a printable HTML report and open the browser's print/PDF dialog
          const html = generatePdfHtml(board, summary, cards, gates);
          const win = window.open('', '_blank');
          if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
            win.print();
          }
          setSuccess(true);
          setMessage('PDF print dialog opened. Use "Save as PDF" to export.');
        } catch (pdfErr) {
          setMessage(`PDF export failed: ${pdfErr instanceof Error ? pdfErr.message : 'Unknown error'}`);
        }
        setExporting(false);
        return;
      }

      try {
        // Fetch board data client-side
        const [board, summary, cards, gates] = await Promise.all([
          fetchBoard(boardId),
          fetchBoardSummary(boardId).catch(() => null),
          fetchCards(boardId).catch(() => []),
          fetchGates(boardId).catch(() => []),
        ]);

        const boardData = {
          board: { ...board, summary },
          cards,
          gates,
          exported_at: new Date().toISOString(),
        };

        if (selected === 'json') {
          const blob = new Blob(
            [JSON.stringify(boardData, null, 2)],
            { type: 'application/json' }
          );
          downloadBlob(blob, `board-${boardId}.json`);
        } else {
          // CSV
          const csvContent = boardDataToCsv(boardData);
          const blob = new Blob([csvContent], { type: 'text/csv' });
          downloadBlob(blob, `board-${boardId}.csv`);
        }

        setSuccess(true);
        setMessage('Export downloaded (client-side fallback).');
      } catch (fallbackErr) {
        setMessage(
          `Client-side export failed: ${
            fallbackErr instanceof Error
              ? fallbackErr.message
              : 'Unknown error'
          }`
        );
      }
    } finally {
      setExporting(false);
    }
  }, [boardId, selected]);

  return (
    <Modal open={open} onClose={onClose} title="Export Board" width="max-w-md">
      <div className="space-y-4">
        {/* Format selection */}
        <div className="space-y-2">
          {formatOptions.map((fmt) => {
            const Icon = fmt.icon;
            const isSelected = selected === fmt.id;

            return (
              <Card
                key={fmt.id}
                hover
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-brand-secondary border-brand-secondary'
                    : ''
                }`}
                onClick={() => {
                  setSelected(fmt.id);
                  setMessage(null);
                  setSuccess(false);
                }}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Radio indicator */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'border-brand-secondary bg-brand-secondary'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <Icon size={20} className="text-content-muted flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-content-primary">
                      {fmt.label}
                    </div>
                    <div className="text-xs text-content-tertiary">
                      {fmt.description}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Status message */}
        {message && (
          <div
            className={`text-sm px-3 py-2 ${
              success
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {success && <Check size={14} className="inline mr-1" />}
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={exporting ? undefined : Download}
            loading={exporting}
            onClick={handleExport}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

/** Generate a printable HTML document for PDF export via browser print dialog */
function generatePdfHtml(
  board: Board,
  summary: BoardSummary | null,
  cards: CardType[],
  gates: Gate[]
): string {
  const readiness = summary?.overall_readiness ?? 0;
  const cardRows = cards.map(c =>
    `<tr><td>${escapeHtml(c.name ?? '')}</td><td>${escapeHtml(c.type ?? '')}</td><td>${escapeHtml(c.status ?? '')}</td></tr>`
  ).join('');
  const gateRows = gates.map(g =>
    `<tr><td>${escapeHtml(g.name ?? '')}</td><td>${escapeHtml(g.type ?? '')}</td><td>${escapeHtml(g.status ?? '')}</td><td>${g.requirements?.filter(r => r.satisfied).length ?? 0}/${g.requirements?.length ?? 0}</td></tr>`
  ).join('');

  return `<!DOCTYPE html><html><head><title>${escapeHtml(board.name ?? '')} — Board Report</title>
<style>
body{font-family:system-ui,sans-serif;margin:2rem;color:#1a1a1a}
h1{font-size:1.5rem;margin-bottom:.25rem}
h2{font-size:1.1rem;margin-top:1.5rem;border-bottom:1px solid #ddd;padding-bottom:.25rem}
table{width:100%;border-collapse:collapse;margin-top:.5rem;font-size:.85rem}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #eee}
th{background:#f5f5f5;font-weight:600}
.meta{color:#666;font-size:.85rem}
.badge{display:inline-block;padding:2px 8px;border-radius:2px;font-size:.75rem;font-weight:600}
.readiness{font-size:2rem;font-weight:700;color:#2563eb}
@media print{body{margin:0.5in}}
</style></head><body>
<h1>${escapeHtml(board.name ?? '')}</h1>
<p class="meta">Mode: ${escapeHtml(board.mode ?? '')} · Status: ${escapeHtml(board.status ?? '')} · Exported: ${new Date().toLocaleString()}</p>
<h2>Readiness</h2>
<p class="readiness">${Math.round(readiness)}%</p>
<p class="meta">${summary?.card_progress.completed ?? 0}/${summary?.card_progress.total ?? 0} cards completed · ${summary?.gate_count ?? 0} gates</p>
<h2>Cards (${cards.length})</h2>
<table><thead><tr><th>Name</th><th>Type</th><th>Status</th></tr></thead><tbody>${cardRows || '<tr><td colspan="3">No cards</td></tr>'}</tbody></table>
<h2>Gates (${gates.length})</h2>
<table><thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Requirements</th></tr></thead><tbody>${gateRows || '<tr><td colspan="4">No gates</td></tr>'}</tbody></table>
</body></html>`;
}

ExportDialog.displayName = 'ExportDialog';

export default ExportDialog;
