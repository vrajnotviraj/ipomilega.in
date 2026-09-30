'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Board } from '@/lib/ipo-format';

// The Mainboard/SME tabs sit in the Live section, but the choice filters every home section.
const BoardContext = createContext<{ board: Board; setBoard: (b: Board) => void }>({
  board: 'Mainboard',
  setBoard: () => {},
});

export function BoardProvider({ children }: { children: ReactNode }) {
  const [board, setBoard] = useState<Board>('Mainboard');
  return <BoardContext.Provider value={{ board, setBoard }}>{children}</BoardContext.Provider>;
}

export const useBoard = () => useContext(BoardContext);
