// ============================================================
// Board-studio route constants
// ============================================================

export const ROUTES = {
  BOARDS: '/boards',
  BOARD_DETAIL: '/boards/:boardId',
  CARD_DETAIL: '/boards/:boardId/cards/:cardId',
  RELEASE_PACKET: '/boards/:boardId/release-packet',
  APPROVALS: '/approvals',
  MEMORY: '/memory',
} as const;
