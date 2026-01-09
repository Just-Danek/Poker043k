export type Screen = 'menu' | 'lobby' | 'stats' | 'game';
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
}

export interface Player {
    id: number;
    name: string;
    chips: number;
    currentBet: number;
    lastAction: PlayerAction;
    active: boolean;
    folded: boolean;
    isHost: boolean;
    isYou?: boolean;
    role?: 'd' | 'sb' | 'bb' | 'none';
    hand?: string[];
    handSize?: number;
}

export type ServerPlayerSnapshot = Player & { socketId: string };

export interface WinnerInfo {
    winners: { name: string; id: number }[];
    amount: number;
    combination: string;
}

export interface RoomInfo {
    roomId: string;
    name: string;
    currentPlayers: number;
    maxPlayers: number;
    status: 'waiting' | 'playing';
    hasPassword?: boolean;
}

export interface ServerRoomInfo extends RoomInfo {
    password?: string;
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

export interface RoomUpdatePayload {
    roomId: string;
    maxPlayers: number;
    players: ServerPlayerSnapshot[];
    gameState?: GameState;
}

export interface PlayersUpdatePayload {
    players: ServerPlayerSnapshot[];
}

export interface GameUpdatePayload {
    gameState: GameState;
    players?: ServerPlayerSnapshot[];
}

export interface RoundEndedPayload {
    winners: WinnerInfo['winners'];
    amount: number;
    combination: string;
}

export interface GameOverPayload {
    winnerName: string;
    [key: string]: unknown;
}

export interface SocketErrorPayload {
    message: string;
}

export interface UserStats {
    totalGames: number;
    wins: number;
    totalTurnover: number;
    bestHand: string;
}