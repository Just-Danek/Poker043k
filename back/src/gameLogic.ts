import { Server } from 'socket.io';
import { GameState, Player, ServerRoomState } from './types';
import { Deck } from './deck';
import { userApiClient } from './services/userApiClient'
import { statsService } from './services/statsService';
// @ts-ignore
import { Hand } from 'pokersolver';


type LobbyEmitter = () => void;

let lobbyEmitter: LobbyEmitter | null = null;

export const setLobbyRoomsEmitter = (emitter: LobbyEmitter) => {
    lobbyEmitter = emitter;
};

const emitLobbySnapshot = () => {
    lobbyEmitter?.();
};

const DEFAULT_TURN_TIME_LIMIT = 30000;

const getTurnTimeLimit = (room: ServerRoomState) => {
    const limit = room.config?.turnTimeLimitMs ?? DEFAULT_TURN_TIME_LIMIT;
    return limit > 0 ? limit : DEFAULT_TURN_TIME_LIMIT;
};

const startTurnTimer = (io: Server, room: ServerRoomState) => {
    if (room.turnTimer) {
        clearTimeout(room.turnTimer);
    }

    const token = Symbol('turn');
    room.turnTimerToken = token;

    room.turnTimer = setTimeout(() => {
        if (room.turnTimerToken !== token) return;

        const activePlayer = room.players[room.gameState.activePlayerIndex];
        if (activePlayer) {
            console.warn(`[AUTO-FOLD] Timer expired for room ${room.config.name}`);
            handlePlayerAction(io, room, activePlayer, { type: 'fold' });
        }
    }, getTurnTimeLimit(room));
};

const stopTurnTimer = (room: ServerRoomState) => {
    if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = undefined;
    }
    room.turnTimerToken = undefined;
};

const resetPlayerForNewRound = (player: Player) => {
    player.folded = false;
    player.lastAction = 'none';
    player.currentBet = 0;
    player.totalContribution = 0;
    player.role = 'none';
    player.hand = [];
};

const applyContribution = (player: Player, amount: number, gameState: GameState) => {
    if (amount <= 0) return;

    const available = Math.max(player.chips, 0);
    const contribution = Math.min(amount, available);
    if (contribution <= 0) return;

    player.chips -= contribution;
    player.currentBet += contribution;
    player.totalContribution += contribution;
    gameState.potTotal += contribution;
    gameState.roundContribution += contribution;
};

const drawCardOrThrow = (deck: Deck): string => {
    const card = deck.draw();
    if (!card) {
        throw new Error('Deck is empty');
    }
    return card;
};

const getNextActivePlayerIndex = (room: ServerRoomState, startIndex: number) => {
    const { players } = room;
    const total = players.length;
    if (!total) return -1;

    let idx = (startIndex + 1) % total;
    let loop = 0;

    while (loop < total) {
        const candidate = players[idx];
        if (!candidate.folded && candidate.active && candidate.chips > 0) {
            return idx;
        }
        idx = (idx + 1) % total;
        loop++;
    }

    return -1;
};

const revealRemainingCommunityCards = (room: ServerRoomState) => {
    const needed = 5 - room.gameState.communityCards.length;
    if (needed <= 0) return;

    for (let i = 0; i < needed; i++) {
        room.gameState.communityCards.push(drawCardOrThrow(room.deck));
    }
};

interface SidePotSlice {
    amount: number;
    eligiblePlayerIds: number[];
}

const buildSidePots = (room: ServerRoomState): SidePotSlice[] => {
    const contributions = room.players
        .map(p => ({
            playerId: p.id,
            amount: Math.max(0, p.totalContribution || 0),
            stillInHand: !p.folded && p.active,
        }))
        .filter(entry => entry.amount > 0);

    if (!contributions.length) {
        return [];
    }

    const uniqueLevels = Array.from(new Set(contributions.map(c => c.amount))).sort((a, b) => a - b);
    const pots: SidePotSlice[] = [];
    let previousLevel = 0;

    uniqueLevels.forEach(level => {
        if (level <= previousLevel) return;

        const contributors = contributions.filter(c => c.amount >= level);
        if (!contributors.length) return;

        const sliceAmount = (level - previousLevel) * contributors.length;
        const eligible = contributors.filter(c => c.stillInHand).map(c => c.playerId);

        pots.push({ amount: sliceAmount, eligiblePlayerIds: eligible });
        previousLevel = level;
    });

    return pots;
};

const distributePayoutsFromPots = (
    pots: SidePotSlice[],
    handMap: Map<number, any>
): Record<number, number> => {
    const payouts: Record<number, number> = {};

    pots.forEach(pot => {
        if (!pot.eligiblePlayerIds.length) return;

        const eligibleHands = pot.eligiblePlayerIds
            .map(id => handMap.get(id))
            .filter(Boolean);

        if (!eligibleHands.length) return;

        const winners = Hand.winners(eligibleHands);
        const baseShare = Math.floor(pot.amount / winners.length);
        let remainder = pot.amount - baseShare * winners.length;

        winners.forEach((hand: any) => {
            const playerId = hand.playerId as number;
            const award = baseShare + (remainder > 0 ? 1 : 0);
            payouts[playerId] = (payouts[playerId] || 0) + award;
            if (remainder > 0) remainder -= 1;
        });
    });

    return payouts;
};

const performPlayerAction = (
    room: ServerRoomState,
    player: Player,
    actionType: string,
    rawAmount?: number
): boolean => {
    switch (actionType) {
        case 'fold':
            player.folded = true;
            player.lastAction = 'fold';
            return true;
        case 'check':
            if (player.currentBet < room.gameState.currentBet) return false;
            player.lastAction = 'check';
            return true;
        case 'call':
            return handleCall(room, player);
        case 'raise':
            return handleRaise(room, player, rawAmount);
        default:
            return false;
    }
};

const handleCall = (room: ServerRoomState, player: Player): boolean => {
    const { gameState } = room;
    const callAmount = Math.max(0, gameState.currentBet - player.currentBet);

    if (callAmount === 0) {
        player.lastAction = 'check';
        return true;
    }

    const actualCall = Math.min(player.chips, callAmount);
    if (actualCall <= 0) return false;

    applyContribution(player, actualCall, gameState);
    player.lastAction = actualCall < callAmount || player.chips === 0 ? 'all-in' : 'call';
    return true;
};

const handleRaise = (room: ServerRoomState, player: Player, rawAmount?: number): boolean => {
    const { gameState, config } = room;
    const maxAvailableBet = player.currentBet + player.chips;

    if (maxAvailableBet <= gameState.currentBet) {
        return false;
    }

    const requestedAmount = typeof rawAmount === 'number' && rawAmount > 0 ? rawAmount : maxAvailableBet;
    const minRaiseIncrement = Math.max(config.bigBlind, gameState.lastRaiseSize || config.bigBlind);
    const minTarget = gameState.currentBet === 0
        ? config.bigBlind
        : gameState.currentBet + minRaiseIncrement;

    let targetBet = Math.max(minTarget, requestedAmount);
    if (targetBet > maxAvailableBet) {
        targetBet = maxAvailableBet;
    }

    if (targetBet <= gameState.currentBet) {
        return false;
    }

    const diff = targetBet - player.currentBet;
    if (diff <= 0) return false;

    applyContribution(player, diff, gameState);

    const raiseDelta = targetBet - gameState.currentBet;
    if (raiseDelta >= minRaiseIncrement) {
        gameState.lastRaiseSize = raiseDelta;
    }

    gameState.currentBet = Math.max(gameState.currentBet, targetBet);
    player.lastAction = player.chips === 0 ? 'all-in' : 'raise';
    return true;
};

export const startNewRound = (io: Server, room: ServerRoomState) => {
    stopTurnTimer(room);

    const snapshotPlayers = [...room.players];
    const previousDealerId = room.gameState.dealerIndex >= 0
        ? snapshotPlayers[room.gameState.dealerIndex]?.id ?? null
        : null;

    const survivingPlayers = snapshotPlayers.filter(p => p.active && p.chips > 0);
    room.players = survivingPlayers;
    emitLobbySnapshot();

    room.players.forEach(p => resetPlayerForNewRound(p));

    if (room.players.length < 2) {
        room.gameState.status = 'finished';
        room.gameState.activePlayerIndex = -1;

        const winner = room.players[0] ?? null;
        const notifyPlayers = snapshotPlayers.length ? snapshotPlayers : room.players;
        notifyPlayers.forEach(p => {
            io.to(p.socketId).emit('game_over', {
                winnerName: winner ? winner.name : 'Unknown',
                reason: winner && winner.id === p.id ? 'win' : 'table_closed',
            });
        });

        emitLobbySnapshot();

        setTimeout(() => {
            room.players = [];
            emitLobbySnapshot();
        }, 10000);

        return;
    }

    if (room.gameState.dealerIndex === -1 || !previousDealerId) {
        room.gameState.dealerIndex = 0;
    } else {
        const previousDealerIndex = room.players.findIndex(p => p.id === previousDealerId);
        room.gameState.dealerIndex = previousDealerIndex === -1
            ? 0
            : (previousDealerIndex + 1) % room.players.length;
    }
    if (room.players[room.gameState.dealerIndex]) {
        room.players[room.gameState.dealerIndex].role = 'd';
    }

    room.deck = new Deck();
    room.deck.shuffle();

    room.players.forEach(player => {
        resetPlayerForNewRound(player);
        player.hand = [drawCardOrThrow(room.deck), drawCardOrThrow(room.deck)];
        player.roundStartChips = player.chips;
    });

    room.gameState.status = 'playing';
    room.gameState.stage = 'preflop';
    room.gameState.communityCards = [];
    room.gameState.potTotal = 0;
    room.gameState.roundContribution = 0;
    room.gameState.currentBet = 0;
    room.gameState.activePlayerIndex = -1;
    room.gameState.lastRaiseSize = room.config.bigBlind;

    const playerCount = room.players.length;
    let sbIndex = (room.gameState.dealerIndex + 1) % playerCount;
    let bbIndex = (room.gameState.dealerIndex + 2) % playerCount;

    if (playerCount === 2) {
        sbIndex = room.gameState.dealerIndex;
        bbIndex = (room.gameState.dealerIndex + 1) % playerCount;
    }

    const sbPlayer = room.players[sbIndex];
    const bbPlayer = room.players[bbIndex];

    sbPlayer.role = 'sb';
    bbPlayer.role = 'bb';

    const actualSb = Math.min(sbPlayer.chips, room.config.smallBlind);
    applyContribution(sbPlayer, actualSb, room.gameState);
    sbPlayer.lastAction = sbPlayer.chips === 0 ? 'all-in' : 'bet';

    const actualBb = Math.min(bbPlayer.chips, room.config.bigBlind);
    applyContribution(bbPlayer, actualBb, room.gameState);
    bbPlayer.lastAction = bbPlayer.chips === 0 ? 'all-in' : 'bet';

    room.gameState.currentBet = Math.max(sbPlayer.currentBet, bbPlayer.currentBet);
    room.gameState.roundContribution = room.gameState.potTotal;
    room.gameState.lastRaiseSize = Math.max(actualBb, room.config.bigBlind);

    const firstToAct = getNextActivePlayerIndex(room, bbIndex);
    room.gameState.activePlayerIndex = firstToAct;

    broadcastGameState(io, room);

    if (firstToAct !== -1) {
        startTurnTimer(io, room);
    } else {
        runoutToShowdown(io, room);
    }
};

export const handlePlayerAction = (
    io: Server,
    room: ServerRoomState,
    player: Player,
    action: { type: string; amount?: number }
) => {
    const { gameState, players } = room;

    if (!action || typeof action.type !== 'string') return;

    if (
        gameState.activePlayerIndex === -1 ||
        gameState.status !== 'playing' ||
        gameState.stage === 'showdown'
    ) {
        return;
    }

    const activePlayer = players[gameState.activePlayerIndex];
    if (!activePlayer || activePlayer.id !== player.id || activePlayer.socketId !== player.socketId) {
        return;
    }

    stopTurnTimer(room);

    const normalizedType = action.type === 'bet' ? 'raise' : action.type;
    const actionApplied = performPlayerAction(room, player, normalizedType, action.amount);

    if (!actionApplied) {
        startTurnTimer(io, room);
        return;
    }

    nextTurn(io, room);
};

export const handleGameDisconnect = (io: Server, room: ServerRoomState, player: Player) => {
    const startChips = player.roundStartChips ?? player.chips;
    const delta = player.chips - startChips;

    if (delta !== 0) {
        userApiClient.updateBalance(player.id, delta, room.config.name, 'disconnect_loss')
            .catch(err => console.error(`[SYNC ERROR] Player ${player.id} disconnect sync failed:`, err));
        player.roundStartChips = player.chips;
    }

    player.active = false;
    player.folded = true;
    player.lastAction = 'fold';

    const activePlayersInRound = room.players.filter(p => !p.folded && p.active);

    if (activePlayersInRound.length === 1) {
        stopTurnTimer(room);
        const payout = { [activePlayersInRound[0].id]: room.gameState.potTotal };
        endRound(io, room, [activePlayersInRound[0]], 'Opponent Left', payout);
        return;
    }

    const playerIndex = room.players.findIndex(p => p.id === player.id);

    if (room.gameState.activePlayerIndex === playerIndex) {
        stopTurnTimer(room);
        nextTurn(io, room);
    } else {
        broadcastGameState(io, room);
    }
};


const nextTurn = (io: Server, room: ServerRoomState) => {
    const { gameState, players } = room;

    const activePlayersInRound = players.filter(p => !p.folded && p.active);
    if (activePlayersInRound.length === 1) {
        stopTurnTimer(room);
        const payout = { [activePlayersInRound[0].id]: room.gameState.potTotal };
        endRound(io, room, [activePlayersInRound[0]], 'Fold Victory', payout);
        return;
    }

    const playersWithChips = activePlayersInRound.filter(p => p.chips > 0);
    const allMatched = playersWithChips.every(p => p.currentBet === gameState.currentBet);
    const isAllInRunout = playersWithChips.length <= 1;

    if (isAllInRunout && allMatched) {
        stopTurnTimer(room);
        runoutToShowdown(io, room);
        return;
    }

    let nextIndex = getNextActivePlayerIndex(room, gameState.activePlayerIndex);
    if (nextIndex === -1) {
        stopTurnTimer(room);
        runoutToShowdown(io, room);
        return;
    }

    const everyoneActed = playersWithChips.every(p => p.lastAction !== 'none');
    let roundComplete = allMatched && everyoneActed;

    if (gameState.stage === 'preflop' && allMatched) {
        const bbNeedsToAct = playersWithChips.some(p => p.lastAction === 'bet' && p.currentBet === gameState.currentBet);
        if (bbNeedsToAct) {
            roundComplete = false;
        }
    }

    if (roundComplete) {
        stopTurnTimer(room);
        broadcastGameState(io, room);
        setTimeout(() => {
            nextStreet(io, room);
        }, 800);
        return;
    }

    gameState.activePlayerIndex = nextIndex;
    broadcastGameState(io, room);
    startTurnTimer(io, room);
};

// --- АВТОМАТИЧЕСКАЯ ДОКРУТКА (ALL-IN) ---
const runoutToShowdown = (io: Server, room: ServerRoomState) => {
    stopTurnTimer(room);
    try {
        revealRemainingCommunityCards(room);
    } catch (error) {
        console.error('[RUNOUT] Failed to draw cards', error);
    }

    room.gameState.stage = 'showdown';
    broadcastGameState(io, room);
    determineWinner(io, room);
};

const nextStreet = (io: Server, room: ServerRoomState) => {
    const { gameState, deck, players } = room;

    players.forEach(p => {
        p.currentBet = 0;
        if (p.chips === 0 && !p.folded) {
            p.lastAction = 'all-in';
        } else {
            p.lastAction = 'none';
        }
    });
    gameState.currentBet = 0;
    gameState.roundContribution = 0;
    gameState.lastRaiseSize = room.config.bigBlind;

    try {
        switch (gameState.stage) {
            case 'preflop':
                gameState.stage = 'flop';
                gameState.communityCards = [
                    drawCardOrThrow(deck),
                    drawCardOrThrow(deck),
                    drawCardOrThrow(deck),
                ];
                break;
            case 'flop':
                gameState.stage = 'turn';
                gameState.communityCards.push(drawCardOrThrow(deck));
                break;
            case 'turn':
                gameState.stage = 'river';
                gameState.communityCards.push(drawCardOrThrow(deck));
                break;
            case 'river':
                gameState.stage = 'showdown';
                determineWinner(io, room);
                return;
            default:
                return;
        }
    } catch (error) {
        determineWinner(io, room);
        return;
    }

    const buttonIndex = room.gameState.dealerIndex === -1 ? 0 : room.gameState.dealerIndex;
    const firstBettor = getNextActivePlayerIndex(room, buttonIndex);
    room.gameState.activePlayerIndex = firstBettor;
    broadcastGameState(io, room);

    if (firstBettor !== -1) {
        startTurnTimer(io, room);
    } else {
        runoutToShowdown(io, room);
    }
};

const determineWinner = (io: Server, room: ServerRoomState) => {
    const { players, gameState } = room;
    gameState.activePlayerIndex = -1;
    const activePlayers = players.filter(p => !p.folded && p.active);

    if (activePlayers.length === 0) {
        endRound(io, room, [], 'No Contest');
        return;
    }

    if (activePlayers.length === 1) {
        const payout = { [activePlayers[0].id]: room.gameState.potTotal };
        endRound(io, room, activePlayers, 'Last Man Standing', payout);
        return;
    }

    const handMap = new Map<number, any>();
    activePlayers.forEach(player => {
        const solverCards = (player.hand || []).concat(gameState.communityCards).map(convertCardToSolver);
        const solvedHand: any = Hand.solve(solverCards);
        solvedHand.playerId = player.id;

        if (solvedHand) {
            statsService.updateBestHand(player.id, solvedHand.descr, solvedHand.rank)
                .catch(e => console.error("Failed to update best hand", e));
        }

        handMap.set(player.id, solvedHand);
    });

    const allHands = Array.from(handMap.values());
    const comboName = allHands.length ? (Hand.winners(allHands)[0]?.name || 'Unknown') : 'Unknown';

    let pots = buildSidePots(room);
    if (!pots.length) {
        pots = [{ amount: gameState.potTotal, eligiblePlayerIds: activePlayers.map(p => p.id) }];
    }

    const payouts = distributePayoutsFromPots(pots, handMap);

    const payoutWinners = Object.keys(payouts)
        .map(id => players.find(p => p.id === Number(id)))
        .filter((p): p is Player => Boolean(p));

    broadcastGameState(io, room);

    players.forEach(p => {
        io.to(p.socketId).emit('showdown', {
            players,
            winners: payoutWinners.map(w => w.id),
            combination: comboName,
            payouts,
        });
    });

    setTimeout(() => {
        endRound(io, room, payoutWinners, comboName, payouts);
    }, 5000);
};

const endRound = (
    io: Server,
    room: ServerRoomState,
    winners: Player[],
    reason: string,
    customPayouts?: Record<number, number>
) => {
    stopTurnTimer(room);

    if (customPayouts && Object.keys(customPayouts).length > 0) {
        Object.entries(customPayouts).forEach(([playerId, amount]) => {
            const target = room.players.find(p => p.id === Number(playerId));
            if (target) {
                target.chips += amount;
            }
        });
    } else if (winners.length > 0) {
        const share = Math.floor(room.gameState.potTotal / winners.length);
        winners.forEach(w => {
            w.chips += share;
        });
    }

    room.players.forEach(p => {
        const startChips = p.roundStartChips ?? p.chips;
        const currentChips = p.chips;
        const delta = currentChips - startChips;

        if (delta !== 0) {
            userApiClient.updateBalance(p.id, delta, room.config.name, 'hand_result')
                .catch(err => console.error(`[SYNC ERROR] Player ${p.id} failed to sync delta ${delta}:`, err));
            
            p.roundStartChips = currentChips;
        }

        const isWinner = winners.some(w => w.id === p.id);
        const turnover = p.totalContribution || 0;
        
        // Record stats
        statsService.recordGame(p.id, isWinner, turnover)
            .catch(e => console.error("Failed to record stats for player " + p.id, e));
    });

    const winAmount = room.gameState.potTotal;
    
    room.players.forEach(p => {
        io.to(p.socketId).emit('round_ended', {
            winners: winners.map(w => ({ name: w.name, id: w.id })),
            amount: winAmount,
            combination: reason,
            payouts: customPayouts || null,
        });
    });

    room.gameState.potTotal = 0;
    room.gameState.communityCards = [];
    room.gameState.currentBet = 0;
    room.gameState.roundContribution = 0;
    room.gameState.activePlayerIndex = -1;
    room.gameState.lastRaiseSize = room.config.bigBlind;

    room.players.forEach(p => {
        p.hand = [];
        p.currentBet = 0;
        p.totalContribution = 0;
        if (p.chips === 0) {
            p.active = false;
            p.folded = true;
        } else {
            p.folded = false;
            p.lastAction = 'none';
        }
    });

    broadcastGameState(io, room);

    setTimeout(() => {
        try {
            startNewRound(io, room);
        } catch (error) {
            console.error('[ROUND] Failed to start new round', error);
        }
    }, 4000);
};

const broadcastGameState = (io: Server, room: ServerRoomState) => {
    const { gameState, players } = room;
    const isShowdown = gameState.stage === 'showdown';

    players.forEach(p => {
        const specificState = { ...gameState };
        specificState.playerCards = p.hand || [];
        
        const sanitizedPlayers = players.map(pl => {
            const currentHandSize = pl.hand ? pl.hand.length : 0;
            if (pl.id === p.id) return { ...pl, isYou: true, handSize: currentHandSize  };

            const shouldReveal = isShowdown && !pl.folded && pl.active;
            return { 
                ...pl, 
                hand: shouldReveal ? pl.hand : undefined,
                handSize: pl.folded ? 0 : currentHandSize,
                isYou: pl.id === p.id 
            };
        });
        io.to(p.socketId).emit('game_updated', { gameState: specificState, players: sanitizedPlayers });
    });
};

function convertCardToSolver(card: string): string {
    if (!card) return '2s';

    let rank = card.slice(0, -1);
    const suitSymbol = card.slice(-1);

    if (rank === '10') rank = 'T';

    const suitMap: Record<string, string> = {
        '♥': 'h', 
        '♦': 'd', 
        '♣': 'c', 
        '♠': 's',
        'h': 'h', 
        'd': 'd', 
        'c': 'c', 
        's': 's',
        'H': 'h', 
        'D': 'd', 
        'C': 'c', 
        'S': 's'
    };

    const suit = suitMap[suitSymbol] || 's';

    return rank + suit;
}