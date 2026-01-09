import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../../entities/game/model/store';
import { useRoomStore } from '../../../entities/room/model/store';
import { SEAT_LAYOUTS } from '../model/constants';

export const useTableSeats = () => {
    const { players, activePlayerIndex } = useGameStore(useShallow((state) => ({
        players: state.players,
        activePlayerIndex: state.activePlayerIndex,
    })));
    const maxPlayers = useRoomStore((state) => state.config?.maxPlayers) || 6;

    const layoutClasses = useMemo(
        () => SEAT_LAYOUTS[maxPlayers] || SEAT_LAYOUTS[6],
        [maxPlayers],
    );

    const { seats, activePlayerId } = useMemo(() => {
        const heroIndex = players.findIndex((player) => player.isYou);
        const rotatedPlayers = heroIndex === -1
            ? players
            : [...players.slice(heroIndex), ...players.slice(0, heroIndex)];

        const computedSeats = Array.from({ length: maxPlayers }, (_, index) => rotatedPlayers[index] || null);
        const currentActiveId = players[activePlayerIndex]?.id;

        return { seats: computedSeats, activePlayerId: currentActiveId };
    }, [players, activePlayerIndex, maxPlayers]);

    return { seats, layoutClasses, activePlayerId };
};