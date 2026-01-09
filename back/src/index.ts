import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { Player, RoomInfo, ServerRoomState } from './types';
import { Deck } from './deck';
import { handlePlayerAction, startNewRound, handleGameDisconnect, setLobbyRoomsEmitter } from './gameLogic';
import { userApiClient } from './services/userApiClient';
import { statsService } from './services/statsService';

const app = express();
app.use(cors());

const frontendPath = path.join(__dirname, '../../front/dist'); 
app.use(express.static(frontendPath));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const rooms = new Map<string, ServerRoomState>();
const MIN_BUY_IN_BBS = 3;
const BIG_BLIND = 100;

setLobbyRoomsEmitter(() => io.emit('rooms_update', getPublicRooms()));

const generateRoomId = () => Math.random().toString(36).substring(2, 7).toUpperCase();

const getPublicRooms = (): RoomInfo[] => {
    const publicRooms: RoomInfo[] = [];
    rooms.forEach((room: ServerRoomState, roomId: string) => {
        publicRooms.push({
            roomId,
            name: room.config.name,
            currentPlayers: room.players.length,
            maxPlayers: room.config.maxPlayers,
            status: room.gameState.status,
            hasPassword: Boolean(room.config.password && room.config.password.length > 0),
        });
    });

    return publicRooms;
};

const leaveRoom = (socketId: string) => {
    let targetRoomId: string | null = null;

    rooms.forEach((room, roomId) => {
        if (room.players.find(p => p.socketId === socketId)) targetRoomId = roomId;
    });

    if (!targetRoomId) return;

    const room = rooms.get(targetRoomId)!;
    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    
    if (playerIndex === -1) return;

    const player = room.players[playerIndex];
    const wasHost = player.isHost;

    console.log(`User ${player.name} leaving room ${targetRoomId}`);

    if (room.gameState.status === 'playing') {
        handleGameDisconnect(io, room, player);
    } else {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length > 0) {
            if (wasHost) {
                room.players[0].isHost = true;
                room.players[0].role = 'd';
            }
            io.to(targetRoomId).emit('update_players', { players: room.players });
        }
    }

    const hasActivePlayers = room.players.some(p => p.active);

    if (room.players.length === 0 || !hasActivePlayers) {
        console.log(`Room ${targetRoomId} is empty/dead. Deleting.`);
        
        if (room.turnTimer) clearTimeout(room.turnTimer);
        
        rooms.delete(targetRoomId);
    }
    
    io.emit('rooms_update', getPublicRooms());
};

io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('create_room', async (data) => {
        const playerId = data.playerId || data.player?.id;
        console.log(`[SOCKET] create_room request received from player ID: ${playerId}`, JSON.stringify(data));

        if (!playerId) {
            console.error(`[SOCKET ERROR] create_room: No playerId provided in request`);
            socket.emit('error', { message: 'Ошибка авторизации: нет ID игрока' });
            return;
        }

        const userProfile = await userApiClient.getUser(playerId);

        if (!userProfile) {
            console.error(`[SOCKET ERROR] create_room: userApiClient.getUser returned null for ${playerId}`);
            socket.emit('error', { message: 'Не удалось загрузить профиль. Попробуйте позже.' });
            return;
        }
        
        const finalName = userProfile.username;
        const finalBalance = userProfile.balance; 
        
        const incomingSmallBlind = Number(data?.smallBlind);
        const resolvedSmallBlind = Number.isFinite(incomingSmallBlind) && incomingSmallBlind > 0 ? incomingSmallBlind : 50;
        const incomingBigBlind = Number(data?.bigBlind);
        const resolvedBigBlindCandidate = Number.isFinite(incomingBigBlind) && incomingBigBlind > 0
        ? incomingBigBlind
            : resolvedSmallBlind * 2;
        const resolvedBigBlind = Math.max(resolvedSmallBlind * 2, resolvedBigBlindCandidate);
        const incomingTurnTime = Number(data?.turnTimeLimitMs);
        const resolvedTurnTime = Number.isFinite(incomingTurnTime) && incomingTurnTime >= 5000
        ? incomingTurnTime
        : 30000;

        if (userProfile.balance <= 0) {
            socket.emit('error', { message: `У вас 0 фишек. Нужно минимум ${resolvedBigBlind * MIN_BUY_IN_BBS} для создания комнаты.` });
            return;
        }
        
        const minChipsNeeded = resolvedBigBlind * MIN_BUY_IN_BBS;

        if (finalBalance < minChipsNeeded) {
            return socket.emit('error', { 
                message: `Не хватает фишек. Ваш баланс: ${finalBalance}, а нужно минимум ${minChipsNeeded} (${MIN_BUY_IN_BBS} BB)` 
            });
        }

        const roomId = generateRoomId();

        const hostPlayer: Player = {
            id: playerId, 
            socketId: socket.id, 
            name: finalName,    
            chips: finalBalance,
            currentBet: 0,
            totalContribution: 0,
            lastAction: 'none', active: true, folded: false, isHost: true, role: 'd', hand: [],
        };

        const newRoom: ServerRoomState = {
            gameState: {
                status: 'waiting', communityCards: [], playerCards: [], playerChips: 0, currentBet: 0,
                potTotal: 0, roundContribution: 0, stage: 'preflop', activePlayerIndex: -1, dealerIndex: -1,
                lastRaiseSize: resolvedBigBlind,
            },
            players: [hostPlayer],
            deck: new Deck(),
            config: {
                maxPlayers: data.maxPlayers,
                name: data.name,
                smallBlind: resolvedSmallBlind,
                bigBlind: resolvedBigBlind,
                turnTimeLimitMs: resolvedTurnTime,
                password: data.password,
            }
        };
        
        rooms.set(roomId, newRoom);
        socket.join(roomId);
        socket.emit('room_created', { roomId, players: newRoom.players, gameState: newRoom.gameState, maxPlayers: data.maxPlayers });
        io.emit('rooms_update', getPublicRooms());
    });

    socket.on('get_rooms', () => socket.emit('rooms_list', getPublicRooms()));

    socket.on('start_game', (data) => {
        const room = rooms.get(data.roomId);
        if (!room || room.players.length < 2) return;
        startNewRound(io, room);
    });

    socket.on('join_room', async (data) => {
        const room = rooms.get(data.roomId);
        if (!room) return socket.emit('error', { message: 'Комната не найдена' });

        if (room.config.password) {
            if (!data.password || data.password !== room.config.password) {
                return socket.emit('error', { message: 'Неверный пароль' });
            }
        }

        const playerId = data.playerId || data.player?.id;
        console.log(`[SOCKET] join_room request for room ${data.roomId} from player ID: ${playerId}`);

        if (!playerId) {
            console.error(`[SOCKET ERROR] join_room: No playerId provided`);
            return socket.emit('error', { message: 'Ошибка: нет ID игрока' });
        }

        const existingPlayer = room.players.find(p => p.id === playerId);
        if (existingPlayer) {
            existingPlayer.socketId = socket.id;
            existingPlayer.active = true;

            socket.join(data.roomId);
            socket.emit('room_joined', { 
                roomId: data.roomId, 
                players: room.players, 
                gameState: room.gameState, 
                maxPlayers: room.config.maxPlayers 
            });

            io.to(data.roomId).emit('update_players', { players: room.players });
            io.emit('rooms_update', getPublicRooms());
            return;
        }

        if (room.players.length >= room.config.maxPlayers) return socket.emit('error', { message: 'Комната переполнена' });
        if (room.gameState.status === 'playing') return socket.emit('error', { message: 'Игра уже идет' });

        const userProfile = await userApiClient.getUser(playerId);
        if (!userProfile) {
            console.error(`[SOCKET ERROR] join_room: userApiClient.getUser returned null for ${playerId}`);
            return socket.emit('error', { message: 'Ошибка авторизации. Профиль не найден.' });
        }

        const finalName = userProfile.username;
        const finalBalance = userProfile.balance;

        const effectiveBigBlind = room.config.bigBlind;
        const minChipsNeeded = effectiveBigBlind * MIN_BUY_IN_BBS;

        if (finalBalance < minChipsNeeded) {
            return socket.emit('error', { 
                message: `Не хватает фишек! Ваш баланс: ${finalBalance}. Для этого стола (BB: ${effectiveBigBlind}) нужно минимум ${minChipsNeeded}` 
            });
        }

        const newPlayer: Player = {
            id: playerId,
            socketId: socket.id,
            name: finalName,
            chips: finalBalance,
            currentBet: 0,
            totalContribution: 0,
            lastAction: 'none',
            active: true,
            folded: false,
            isHost: false,
            isYou: false,
            role: 'none',
            hand: [],
        };

        room.players.push(newPlayer);
        socket.join(data.roomId);
        io.to(data.roomId).emit('update_players', { players: room.players });
        
        socket.emit('room_joined', { 
            roomId: data.roomId, 
            players: room.players, 
            gameState: room.gameState, 
            maxPlayers: room.config.maxPlayers
        });
        io.emit('rooms_update', getPublicRooms());
    });

    socket.on('leave_room', () => leaveRoom(socket.id));
    socket.on('disconnect', () => leaveRoom(socket.id));

    socket.on('player_action', (action) => {
        let roomId: string | null = null;
        let player: Player | null = null;
        rooms.forEach((r, id) => {
            const p = r.players.find(pl => pl.socketId === socket.id);
            if (p) { roomId = id; player = p; }
        });
        if (roomId && player) handlePlayerAction(io, rooms.get(roomId)!, player, action);
    });
});

app.get('/api/stats/:userId', async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        if (isNaN(userId)) {
            res.status(400).json({ error: 'Invalid User ID' });
            return;
        }
        
        const stats = await statsService.getStats(userId);
        res.json(stats);
    } catch (error) {
        console.error("Stats API error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 3000; 
server.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));
