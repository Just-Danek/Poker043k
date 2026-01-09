import { useCallback } from 'react';
import { socket } from '../../../shared/api/socket';
import { useViewerStore } from '../../../entities/viewer/model/store';
import { useRoomStore } from '../../../entities/room/model/store';
import { useGameStore } from '../../../entities/game/model/store';

interface CreateRoomPayload {
    name: string;
    maxPlayers: number;
    password?: string;
}

export const useRoomSessionActions = () => {
    const playerName = useViewerStore((state) => state.name);
    const playerId = useViewerStore((state)=> state.id);
    const roomId = useRoomStore((state) => state.roomId);
    const resetRoom = useRoomStore((state) => state.reset);
    const resetGame = useGameStore((state) => state.resetGame);

    const createRoom = useCallback((payload: CreateRoomPayload) => {
        if (!playerName) return;
        socket.emit('create_room', {
            ...payload,
            playerId,
            playerName,
        });
    }, [playerName]);

    const joinRoom = useCallback((id: string, password?: string) => {
        if (!playerName) return;
        socket.emit('join_room', { roomId: id, playerName, playerId, password });
    }, [playerName]);

    const startGame = useCallback(() => {
        if (!roomId) return;
        socket.emit('start_game', { roomId });
    }, [roomId]);

    const leaveRoom = useCallback(() => {
        socket.emit('leave_room');
        resetGame();
        resetRoom();
    }, [resetGame, resetRoom]);

    return { createRoom, joinRoom, startGame, leaveRoom };
};
