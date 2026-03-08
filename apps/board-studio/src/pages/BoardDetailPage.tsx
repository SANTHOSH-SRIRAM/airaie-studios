// ============================================================
// BoardDetailPage — Engineering Studio workspace layout
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, Spinner, Button } from '@airaie/ui';
import { useBoardDashboard } from '@hooks/useBoardDetail';
import { useCards, useCardGraph, useCreateCard, useUpdateCard, useDeleteCard } from '@hooks/useCards';
import { useGates } from '@hooks/useGates';
import { escalateBoard } from '@api/boards';
import { boardKeys } from '@hooks/useBoards';
import ReadinessSpider from '@components/boards/ReadinessSpider';
import type { ViewMode } from '@components/studio/CanvasToolbar';

// Studio layout components (lightweight shells loaded eagerly)
import StudioLayout from '@components/studio/StudioLayout';
import CommandBar from '@components/studio/CommandBar';
import StatusBar from '@components/studio/StatusBar';
import OutlinePanel from '@components/studio/OutlinePanel';
import BottomPanel from '@components/studio/BottomPanel';
import CreateCardDialog from '@components/studio/CreateCardDialog';
import PlanExecutionPanel from '@components/studio/PlanExecutionPanel';
import { ErrorBoundary as StudioErrorBoundary } from '@airaie/ui';
import BoardRecordsPanel from '@components/studio/BoardRecordsPanel';

// Lazy imports for heavy components (ReactFlow, framer-motion, cmdk)
const BoardCanvas = React.lazy(() => import('@components/studio/BoardCanvas'));
const InspectorPanel = React.lazy(() => import('@components/studio/InspectorPanel'));
const CommandPalette = React.lazy(() => import('@components/studio/CommandPalette'));
const ExportDialog = React.lazy(() => import('@components/boards/ExportDialog'));
const EvidenceDiffView = React.lazy(() => import('@components/boards/EvidenceDiffView'));
const FailureTriagePanel = React.lazy(() => import('@components/boards/FailureTriagePanel'));
const ToolShelfPanel = React.lazy(() => import('@components/boards/ToolShelfPanel'));
const PreflightResults = React.lazy(() => import('@components/boards/PreflightResults'));
const GateList = React.lazy(() => import('@components/boards/GateList'));
const BoardSettingsDialog = React.lazy(() => import('@components/studio/BoardSettingsDialog'));
const BoardCreationWizard = React.lazy(() => import('@components/boards/BoardCreationWizard'));

// --- Loading skeleton ---

function StudioSkeleton() {
  return (
    <div className="flex flex-col h-screen">
      {/* Command bar skeleton */}
      <div className="h-12 border-b border-surface-border bg-white flex items-center px-4 gap-4">
        <div className="h-4 w-24 studio-skeleton" />
        <div className="h-4 w-48 studio-skeleton" />
        <div className="h-5 w-16 studio-skeleton" />
      </div>

      {/* Content skeleton */}
      <div className="flex-1 flex">
        <div className="w-52 border-r border-surface-border p-3 space-y-2">
          <div className="h-4 w-20 studio-skeleton" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-6 studio-skeleton" />
          ))}
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="h-8 w-64 studio-skeleton" />
          <div className="h-64 studio-skeleton" />
        </div>
        <div className="w-72 border-l border-surface-border p-3 space-y-3">
          <div className="h-4 w-32 studio-skeleton" />
          <div className="h-48 studio-skeleton" />
          <div className="h-32 studio-skeleton" />
        </div>
      </div>

      {/* Status bar skeleton */}
      <div className="h-7 border-t border-surface-border bg-surface-bg" />
    </div>
  );
}

// --- Main page ---

export default function BoardDetailPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  // --- Data hooks ---
  const { board, summary, isLoading, error, refetch } = useBoardDashboard(boardId);
  const { data: cards = [], isLoading: cardsLoading } = useCards(boardId);
  const { data: gates = [], isLoading: gatesLoading } = useGates(boardId);
  const { data: graphData } = useCardGraph(boardId);

  // --- UI state ---
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
  const [selectedItemType, setSelectedItemType] = useState<'card' | 'gate' | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [bottomPanelVisible, setBottomPanelVisible] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createCardOpen, setCreateCardOpen] = useState(false);
  const [planExecutionOpen, setPlanExecutionOpen] = useState(false);
  const [executingCardId, setExecutingCardId] = useState<string | undefined>();
  const [subBoardWizardOpen, setSubBoardWizardOpen] = useState(false);

  // --- Card operation hooks ---
  const createCardMutation = useCreateCard(boardId!);
  const updateCardMutation = useUpdateCard();
  const deleteCardMutation = useDeleteCard(boardId!);

  // --- Selection handlers ---

  const handleSelectCard = useCallback((cardId: string) => {
    setSelectedItemId(cardId);
    setSelectedItemType('card');
  }, []);

  const handleSelectGate = useCallback((gateId: string) => {
    setSelectedItemId(gateId);
    setSelectedItemType('gate');
  }, []);

  const handleDeselectCard = useCallback(() => {
    setSelectedItemId(undefined);
    setSelectedItemType(undefined);
  }, []);

  const handleViewCardDetail = useCallback((cardId: string) => {
    if (boardId) {
      navigate(`/boards/${boardId}/cards/${cardId}`);
    }
  }, [boardId, navigate]);

  const handleChangeView = useCallback((mode: ViewMode | string) => {
    setViewMode(mode as ViewMode);
  }, []);

  // --- Escalation mutation (shared with CommandBar + CommandPalette) ---
  const qc = useQueryClient();
  const escalateMutation = useMutation({
    mutationFn: (targetMode: string) => escalateBoard(board!.id, targetMode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.detail(board!.id) });
      qc.invalidateQueries({ queryKey: boardKeys.summary(board!.id) });
    },
  });

  const handleEscalate = useCallback(() => {
    if (!board) return;
    const modeEscalationTarget: Record<string, string | undefined> = {
      explore: 'study',
      study: 'release',
    };
    const nextMode = modeEscalationTarget[board.mode];
    if (nextMode) {
      escalateMutation.mutate(nextMode);
    }
  }, [board, escalateMutation]);

  // --- Card action handlers ---

  const handleRunCard = useCallback((cardId: string) => {
    // Select the card, open plan execution panel
    setSelectedItemId(cardId);
    setSelectedItemType('card');
    setExecutingCardId(cardId);
    setPlanExecutionOpen(true);
    setBottomPanelVisible(true);
  }, []);

  const handleStopCard = useCallback((cardId: string) => {
    updateCardMutation.mutate({ id: cardId, status: 'skipped' });
  }, [updateCardMutation]);

  const handleDeleteCard = useCallback((cardId: string) => {
    deleteCardMutation.mutate(cardId, {
      onSuccess: () => {
        // Deselect if the deleted card was selected
        if (selectedItemId === cardId) {
          setSelectedItemId(undefined);
          setSelectedItemType(undefined);
        }
      },
    });
  }, [deleteCardMutation, selectedItemId]);

  const handleCreateCard = useCallback((payload: { name: string; type: string; description?: string; intent_type?: string; config?: Record<string, unknown> }) => {
    createCardMutation.mutate(payload, {
      onSuccess: (newCard) => {
        setCreateCardOpen(false);
        // Select the newly created card
        setSelectedItemId(newCard.id);
        setSelectedItemType('card');
      },
    });
  }, [createCardMutation]);

  const handleOpenCreateCard = useCallback(() => {
    setCreateCardOpen(true);
  }, []);

  const handleCloneCard = useCallback((cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    createCardMutation.mutate({
      name: `${card.name} (copy)`,
      type: card.type,
      description: card.description,
    }, {
      onSuccess: (newCard) => {
        setSelectedItemId(newCard.id);
        setSelectedItemType('card');
      },
    });
  }, [cards, createCardMutation]);

  const handleOpenSubBoardWizard = useCallback(() => {
    setSubBoardWizardOpen(true);
  }, []);

  // --- Keyboard shortcuts ---

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Cmd+K — command palette
      if (isMeta && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }

      // Cmd+B — toggle left panel
      if (isMeta && e.key === 'b') {
        e.preventDefault();
        setLeftPanelVisible((prev) => !prev);
      }

      // Cmd+I — toggle right panel
      if (isMeta && e.key === 'i') {
        e.preventDefault();
        setRightPanelVisible((prev) => !prev);
      }

      // Cmd+J — toggle bottom panel
      if (isMeta && e.key === 'j') {
        e.preventDefault();
        setBottomPanelVisible((prev) => !prev);
      }

      // Cmd+Enter — run selected card
      if (isMeta && e.key === 'Enter') {
        e.preventDefault();
        if (selectedItemId && selectedItemType === 'card') {
          const card = cards.find((c) => c.id === selectedItemId);
          if (card && card.status !== 'running' && card.status !== 'completed' && card.status !== 'blocked' && card.status !== 'skipped') {
            handleRunCard(selectedItemId);
          }
        }
      }

      // Escape — close command palette or deselect
      if (e.key === 'Escape') {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
        } else {
          handleDeselectCard();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, handleDeselectCard, selectedItemId, selectedItemType, cards, handleRunCard]);

  // --- Loading state ---
  if (isLoading) {
    return <StudioSkeleton />;
  }

  // --- Error state ---
  if (error || !board) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-bg">
        <Card>
          <Card.Body>
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertCircle size={32} className="text-status-danger" />
              <h2 className="text-lg font-semibold text-content-primary">
                Failed to load board
              </h2>
              <p className="text-sm text-content-tertiary max-w-md">
                {error instanceof Error
                  ? error.message
                  : 'An unexpected error occurred while loading the board details.'}
              </p>
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // --- Readiness data ---
  const readiness = summary?.readiness ?? {
    design: 0,
    validation: 0,
    compliance: 0,
    manufacturing: 0,
    approvals: 0,
  };

  return (
    <>
      <StudioLayout
        leftPanelVisible={leftPanelVisible}
        rightPanelVisible={rightPanelVisible}
        commandBar={
          <CommandBar
            board={board}
            leftPanelVisible={leftPanelVisible}
            rightPanelVisible={rightPanelVisible}
            onToggleLeftPanel={() => setLeftPanelVisible((p) => !p)}
            onToggleRightPanel={() => setRightPanelVisible((p) => !p)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onOpenExport={() => setExportOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onCreateSubBoard={handleOpenSubBoardWizard}
          />
        }
        statusBar={
          <StatusBar
            board={board}
            summary={summary}
            viewMode={viewMode}
          />
        }
        outlinePanel={
          <OutlinePanel
            cards={cards}
            gates={gates}
            selectedItemId={selectedItemId}
            selectedItemType={selectedItemType}
            onSelectCard={handleSelectCard}
            onSelectGate={handleSelectGate}
            onAddCard={handleOpenCreateCard}
          />
        }
        mainCanvas={
          <BoardCanvas
            boardId={boardId!}
            board={board}
            cards={cards}
            gates={gates}
            graphData={graphData}
            isLoading={cardsLoading || gatesLoading}
            viewMode={viewMode}
            onChangeView={handleChangeView}
            selectedCardId={selectedItemType === 'card' ? selectedItemId : undefined}
            onSelectCard={handleSelectCard}
            onDeselectCard={handleDeselectCard}
            onSearch={() => setCommandPaletteOpen(true)}
            onAddCard={handleOpenCreateCard}
            onRunCard={handleRunCard}
            onStopCard={handleStopCard}
            onViewCardDetail={handleViewCardDetail}
            bottomPanel={
              <BottomPanel
                visible={bottomPanelVisible}
                onToggle={() => setBottomPanelVisible((p) => !p)}
                selectedCardId={selectedItemType === 'card' ? selectedItemId : undefined}
                boardId={boardId!}
                isExecuting={!!executingCardId && executingCardId === selectedItemId}
                evidenceView={
                  boardId ? (
                    <StudioErrorBoundary label="Evidence Diff">
                      <React.Suspense fallback={<Spinner />}>
                        <EvidenceDiffView boardId={boardId} />
                      </React.Suspense>
                    </StudioErrorBoundary>
                  ) : undefined
                }
                triageView={
                  boardId ? (
                    <StudioErrorBoundary label="Failure Triage">
                      <React.Suspense fallback={<Spinner />}>
                        <FailureTriagePanel boardId={boardId} />
                      </React.Suspense>
                    </StudioErrorBoundary>
                  ) : undefined
                }
                toolShelf={
                  selectedItemType === 'card' && selectedItemId ? (
                    <StudioErrorBoundary label="Tool Shelf">
                      <React.Suspense fallback={<Spinner />}>
                        <ToolShelfPanel cardId={selectedItemId} />
                      </React.Suspense>
                    </StudioErrorBoundary>
                  ) : undefined
                }
                preflightResults={
                  selectedItemType === 'card' && selectedItemId ? (
                    <StudioErrorBoundary label="Preflight Results">
                      <React.Suspense fallback={<Spinner />}>
                        <PreflightResults cardId={selectedItemId} />
                      </React.Suspense>
                    </StudioErrorBoundary>
                  ) : undefined
                }
                gateList={
                  boardId ? (
                    <StudioErrorBoundary label="Gates">
                      <React.Suspense fallback={<Spinner />}>
                        <GateList boardId={boardId} />
                      </React.Suspense>
                    </StudioErrorBoundary>
                  ) : undefined
                }
                recordsPanel={
                  boardId ? (
                    <StudioErrorBoundary label="Records">
                      <BoardRecordsPanel boardId={boardId} />
                    </StudioErrorBoundary>
                  ) : undefined
                }
              />
            }
          />
        }
        inspectorPanel={
          <InspectorPanel
            selectedItemId={selectedItemId}
            selectedItemType={selectedItemType}
            summary={summary}
            boardId={boardId!}
            board={board}
            allCards={cards}
            readinessSpider={<ReadinessSpider readiness={readiness} />}
            onRunCard={handleRunCard}
            onStopCard={handleStopCard}
            onDeleteCard={handleDeleteCard}
            onCloneCard={handleCloneCard}
            onViewCardDetail={handleViewCardDetail}
          />
        }
      />

      {/* Command Palette overlay */}
      <StudioErrorBoundary label="Command Palette">
      <React.Suspense fallback={null}>
        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          cards={cards}
          gates={gates}
          boardMode={board.mode}
          onSelectCard={handleSelectCard}
          onSelectGate={handleSelectGate}
          onChangeView={handleChangeView}
          onOpenExport={() => setExportOpen(true)}
          onEscalate={handleEscalate}
          onOpenReleasePacket={board.mode === 'release' ? () => navigate(`/boards/${boardId}/release-packet`) : undefined}
          onCreateSubBoard={handleOpenSubBoardWizard}
        />
      </React.Suspense>
      </StudioErrorBoundary>

      {/* Export dialog */}
      {boardId && (
        <StudioErrorBoundary label="Export">
        <React.Suspense fallback={null}>
          <ExportDialog
            boardId={boardId}
            open={exportOpen}
            onClose={() => setExportOpen(false)}
          />
        </React.Suspense>
        </StudioErrorBoundary>
      )}

      {/* Create card dialog */}
      <CreateCardDialog
        open={createCardOpen}
        onClose={() => setCreateCardOpen(false)}
        onSubmit={handleCreateCard}
        isPending={createCardMutation.isPending}
        board={board}
      />

      {/* Plan execution panel */}
      {executingCardId && (
        <PlanExecutionPanel
          open={planExecutionOpen}
          onClose={() => setPlanExecutionOpen(false)}
          cardId={executingCardId}
          cardName={cards.find((c) => c.id === executingCardId)?.name ?? 'Card'}
        />
      )}

      {/* Board settings dialog */}
      <StudioErrorBoundary label="Settings">
        <React.Suspense fallback={null}>
          <BoardSettingsDialog
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            board={board}
          />
        </React.Suspense>
      </StudioErrorBoundary>

      {/* Sub-board creation wizard */}
      <StudioErrorBoundary label="Board Wizard">
        <React.Suspense fallback={null}>
          <BoardCreationWizard
            open={subBoardWizardOpen}
            onClose={() => setSubBoardWizardOpen(false)}
            mode="guided"
            parentBoardId={board.id}
          />
        </React.Suspense>
      </StudioErrorBoundary>
    </>
  );
}
