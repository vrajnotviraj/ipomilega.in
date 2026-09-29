'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export const BOARD_TABS = ['Mainboard', 'SME'] as const;
export type Board = typeof BOARD_TABS[number];

// The Mainboard/SME tabs live in the Live section, but the choice filters every home section.
const BoardContext = createContext<{ board: Board; setBoard: (b: Board) => void }>({
  board: 'Mainboard',
  setBoard: () => {},
});

export function BoardProvider({ children }: { children: ReactNode }) {
  const [board, setBoard] = useState<Board>('Mainboard');
  return <BoardContext.Provider value={{ board, setBoard }}>{children}</BoardContext.Provider>;
}

export const useBoard = () => useContext(BoardContext);
