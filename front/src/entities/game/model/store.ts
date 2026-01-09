import { create } from 'zustand';
import type { GameState, Player, WinnerInfo } from '../../../shared/api/game';

interface GameStore extends GameState {
    players: Player[];
    winners: WinnerInfo | null;
    gameOverData: { winnerName: string } | null;
    
    setGameState: (state: Partial<GameState>) => void;
    setPlayers: (players: Player[]) => void;
    updatePlayer: (id: number, updates: Partial<Player>) => void;
    setWinners: (winners: WinnerInfo | null) => void;
    setGameOverData: (data: { winnerName: string } | null) => void;
    resetGame: () => void;
}

const initialState: GameState = {
    communityCards: [],
    playerCards: [],
    playerChips: 0,
    currentBet: 0,
    potTotal: 0,
    roundContribution: 0,
    stage: 'preflop',
    status: 'waiting',
    activePlayerIndex: -1,
    dealerIndex: 0,
};

export const useGameStore = create<GameStore>((set) => ({
    ...initialState,
    players: [],
    winners: null,
    gameOverData: null,

    setGameState: (updates) => set((state) => ({ ...state, ...updates })),
    
    setPlayers: (players) => set({ players }),
    
    updatePlayer: (id, updates) => set((state) => ({
        players: state.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

    setWinners: (winners) => set({ winners }),

    setGameOverData: (data) => set({ gameOverData: data }),
    
    resetGame: () => set({ ...initialState, winners: null, players: [], gameOverData: null }),
}));