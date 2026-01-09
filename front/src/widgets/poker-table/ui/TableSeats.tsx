import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../../entities/game/model/store';
import PlayerCell from '../../../entities/player/ui/PlayerCell';
import Seat  from '../../../entities/player/ui/Seat';
import { useTableSeats } from '../lib/useTableSeats';
import './TableSeats.css';

export default function TableSeats() {
    const { seats, layoutClasses, activePlayerId } = useTableSeats();

    const { status, stage, winners } = useGameStore(useShallow(state => ({
        status: state.status,
        stage: state.stage,
        winners: state.winners
    })));

    const isWaiting = status === 'waiting';

    return (
        <>
            {seats.map((player, index) => {
                const positionClass = layoutClasses[index];

                if (!player) {
                    return (
                        <Seat 
                            key={`empty-${index}`} 
                            className={positionClass} 
                            showLoading={isWaiting}
                        />
                    );
                }

                let isActive = player.id === activePlayerId;
                if (stage === 'showdown' || status === 'finished' || winners) isActive = false;

                return (
                    <PlayerCell
                        key={player.id}
                        player={player}
                        position={positionClass}
                        isActive={isActive}
                    />
                );
            })}
        </>
    );
};