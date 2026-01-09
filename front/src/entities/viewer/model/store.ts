import { create } from 'zustand';
import type { GameStats } from '../../../shared/api/game';

interface ViewerState {
    stats: GameStats;
    name: string;
    id: number | null;
    setStats: (stats: GameStats) => void;
    updateBalance: (amount: number) => void;
    setViewerId: (id: number, name: string) => void;
}

const getInitialStats = (): GameStats => ({
    wins: 0,
    losses: 0,
    totalWinnings: 0,
    totalSpent: 0,
    currentBalance: 1000,
    longestWinStreak: 0,
});

const getInitialState = (): Pick<ViewerState, 'name' | 'id' | 'stats'> => ({
    name: 'Guest',
    id: null,
    stats: getInitialStats(),
});

export const useViewerStore = create<ViewerState>((set) => ({
    ...getInitialState(),

    setStats: (stats) => set({ stats }),
    
    updateBalance: (amount) => set((state) => ({
        stats: { ...state.stats, currentBalance: state.stats.currentBalance + amount }
    })),

    setViewerId: (id, name) => set({ id, name }),
}));