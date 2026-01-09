import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../../entities/game/model/store';
import WaitingScreen from '../../../features/waiting-screen/ui/WaitingScreen';
import BoardCenter from '../../../entities/board/ui/BoardCenter';
import TableSeats from './TableSeats';
import './PokerTable.css';

interface PokerTableProps {
    onStartGame: () => void;
}

export default function PokerTable({ onStartGame }: PokerTableProps) {
    const { 
        potTotal, 
        communityCards, 
        status
    } = useGameStore(useShallow(state => ({
        potTotal: state.potTotal,
        communityCards: state.communityCards,
        status: state.status,
    })));

    const isWaiting = status === 'waiting';

    return (
        <div className="poker-table-ring">
            <div className="poker-table-surface">
                <div className="poker-table-center-content">
                    {isWaiting ? (
                        <WaitingScreen onStartGame={onStartGame} />
                    ) : (
                        <BoardCenter 
                            potTotal={potTotal} 
                            communityCards={communityCards} 
                        />
                    )}
                </div>
            </div>

            <TableSeats />
        </div>
    );
};