import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../../entities/game/model/store';
import { useRoomStore } from '../../../entities/room/model/store';
import './WaitingScreen.css';

interface WaitingScreenProps {
    onStartGame: () => void;
}

export default function WaitingScreen({ onStartGame }: WaitingScreenProps) {
    const playersCount = useGameStore(state => state.players.length);
    const maxPlayers = useRoomStore(state => state.config?.maxPlayers) || 6;
    const isHeroHost = useGameStore(useShallow(state => 
        state.players.find(p => p.isYou)?.isHost ?? false
    ));

    return (
        <div className="waiting-screen">
            <div className="waiting-label">ОЖИДАНИЕ ИГРОКОВ</div>
            <div className="waiting-count">{playersCount} / {maxPlayers}</div>
            <button 
                className="btn-start" 
                disabled={playersCount < 2 || !isHeroHost} 
                onClick={onStartGame}
            >
                НАЧАТЬ ИГРУ
            </button>
        </div>
    );
};