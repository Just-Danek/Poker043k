import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../../entities/game/model/store';
import { OverlayCard } from '../../../shared/ui/OverlayCard';
import './GameNotifications.css';

interface GameNotificationsProps {
    onBackToMenu: () => void;
}

export default function GameNotifications({ onBackToMenu }: GameNotificationsProps) {
    const { winnerInfo, gameOverData, status } = useGameStore(useShallow(state => ({
        winnerInfo: state.winners,
        gameOverData: state.gameOverData,
        status: state.status
    })));

    const isFinished = status === 'finished';

    if (winnerInfo) {
        return (
            <OverlayCard title="РАУНД ЗАВЕРШЕН">
                <div className='winner-names'>
                    🏆 {winnerInfo.winners.map(w => w.name).join(', ')}
                </div>
                <div className='winner-amount'>
                    Банк: <span>{winnerInfo.amount}</span>
                </div>
                <div className='winner-combo'>{winnerInfo.combination}</div>
            </OverlayCard>
        );
    }

    if (isFinished || gameOverData) {
        return (
            <OverlayCard title="ТУРНИР ЗАВЕРШЕН" onAction={onBackToMenu} actionText="В МЕНЮ" className='endgame'>
                {gameOverData && (
                    <div className="game-over-winner">Победитель: <b>{gameOverData.winnerName}</b></div>
                )}
            </OverlayCard>
        );
    }

    return null;
};