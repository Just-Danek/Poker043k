import { useCallback } from 'react';
import { socket } from '../../../shared/api/socket';
import { useRoomStore } from '../../../entities/room/model/store';
import type { PlayerAction } from '../../../shared/api/game';

interface PlayerActionPayload {
    type: PlayerAction;
    amount?: number;
}

export const usePlayerActions = () => {
    const roomId = useRoomStore((state) => state.roomId);

    const sendAction = useCallback((payload: PlayerActionPayload) => {
        if (!roomId) {
            console.warn('Невозможно отправить действие без идентификатора комнаты');
            return;
        }
        
        const actionPayload = payload.amount !== undefined
            ? { ...payload, roomId }
            : { type: payload.type, roomId };
        socket.emit('player_action', actionPayload);
    }, [roomId]);

    return { sendAction };
};
