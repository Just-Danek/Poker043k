import { Deck } from './deck';

export type Screen = 'menu' | 'stats' | 'game';
export type PokerStreet = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type PlayerAction = 'fold' | 'call' | 'raise' | 'check' | 'bet' | 'all-in' | 'none';

export interface GameStats {
    wins: number;
    losses: number;
    totalWinnings: number;
    totalSpent: number;
    currentBalance: number;
    longestWinStreak: number;
}

export interface GameState {
    communityCards: string[];
    playerCards: string[];
    playerChips: number;
    currentBet: number;
    potTotal: number;
    roundContribution: number;
    stage: PokerStreet;
    status: 'waiting' | 'playing' | 'finished';
    activePlayerIndex: number;
    dealerIndex: number;
    lastRaiseSize: number;
}

export interface RoomInfo {
    roomId: string;
    name: string;
    currentPlayers: number;
    maxPlayers: number;
    status: 'waiting' | 'playing' | 'finished';
    hasPassword?: boolean;
}

export interface TableConfig {
    maxPlayers: number;
    name: string;
    smallBlind: number;
    bigBlind: number;
    turnTimeLimitMs: number;
    password?: string;
}

export interface ServerRoomState {
    gameState: GameState;
    players: Player[];
    deck: Deck;
    config: TableConfig;
    turnTimer?: NodeJS.Timeout;
    turnTimerToken?: symbol;
    password?: string;
}

export interface Player {
    id: number;
    name: string;
    chips: number;
    currentBet: number;
    totalContribution: number;
    lastAction: PlayerAction;
    active: boolean;
    folded: boolean;
    isHost: boolean;
    socketId: string;
    isYou?: boolean;
    role?: 'd' | 'sb' | 'bb' | 'none';
    hand?: string[];
    roundStartChips?: number;
}

export interface PokerHandInfo {
    name: string;
    description: string;
}

export const actionLabels: Record<string, string> = {
    call: 'CALL',
    raise: 'RAISE',
    fold: 'FOLD',
    check: 'CHECK',
    bet: 'BET',
    'all-in': 'ALL-IN',
    none: '',
};