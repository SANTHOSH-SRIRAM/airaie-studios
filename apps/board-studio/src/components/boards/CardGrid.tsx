// ============================================================
// CardGrid — placeholder (full implementation in Task 2)
// ============================================================

import React from 'react';

export interface CardGridProps {
  boardId: string;
}

const CardGrid: React.FC<CardGridProps> = ({ boardId: _boardId }) => {
  return <div>Card grid loading...</div>;
};

CardGrid.displayName = 'CardGrid';

export default CardGrid;
