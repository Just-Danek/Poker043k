import { useCallback, useEffect, useState } from 'react';
import { socket } from '../../../shared/api/socket';
import type { RoomInfo, ServerRoomInfo } from '../../../shared/api/game';

interface UseLobbyRoomsResult {
    rooms: RoomInfo[];
    isLoading: boolean;
    refresh: () => void;
}

export const useLobbyRooms = (): UseLobbyRoomsResult => {
    const [rooms, setRooms] = useState<RoomInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const requestRooms = useCallback(() => {
        setIsLoading(true);
        socket.emit('get_rooms');
    }, []);

    const mapServerRoom = (rawRoom: ServerRoomInfo): RoomInfo => ({
        roomId: rawRoom.roomId,
        name: rawRoom.name,
        currentPlayers: rawRoom.currentPlayers,
        maxPlayers: rawRoom.maxPlayers,
        status: rawRoom.status,
        hasPassword: Boolean(rawRoom.password && rawRoom.password.length > 0) || rawRoom.hasPassword === true
    });

    useEffect(() => {
        const handleRoomsList = (data: RoomInfo[]) => {
            setRooms(data.map(mapServerRoom));
            setIsLoading(false);
        };

        const handleRoomsUpdate = (data: RoomInfo[]) => {
            setRooms(data.map(mapServerRoom));
        };

        socket.on('rooms_list', handleRoomsList);
        socket.on('rooms_update', handleRoomsUpdate);
        socket.emit('get_rooms');

        return () => {
            socket.off('rooms_list', handleRoomsList);
            socket.off('rooms_update', handleRoomsUpdate);
        };
    }, []);

    return { rooms, isLoading, refresh: requestRooms };
};
