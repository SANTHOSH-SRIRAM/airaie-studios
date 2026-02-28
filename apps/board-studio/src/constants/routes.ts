// ============================================================
// Board-studio route constants
// ============================================================

export const ROUTES = {
  BOARDS: '/boards',
  BOARD_DETAIL: '/boards/:boardId',
  CARD_DETAIL: '/boards/:boardId/cards/:cardId',
  APPROVALS: '/approvals',
} as const;
