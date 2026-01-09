import type { Player } from '../../../shared/api/game';
import { actionLabels } from '../../../shared/api/game';
import Card from '../../card/ui/Card';
import CardBack from '../../card/ui/CardBack';
import './PlayerCell.css';

interface PlayerCellProps {
    player: Player;
    position: string;
    isActive: boolean;
}

export default function PlayerCell({ player, position, isActive }: PlayerCellProps) {
    const { name, chips, currentBet, folded, active, role, lastAction, handSize, hand } = player;

    const onlineClass = active ? '' : 'offline'; 
    const foldClass = folded ? 'folded' : '';
    const timerClass = isActive && !folded ? 'timer-active' : ''; 
    const action = lastAction && (lastAction !== 'none') ? lastAction : null;

    return (
        <div className={`poker-player-seat ${position}`}>
            <div className={`poker-player-avatar ${onlineClass} ${foldClass} ${timerClass}`}>
                {role && role !== 'none' && (
                    <div className={`poker-player-role role-${role}`}>
                        {role.toUpperCase()}
                    </div>
                )}
                <div className="poker-player-name">{name}</div>
                <div className="poker-player-stack">{chips}</div>
                {action && (
                    <div className={`poker-player-badge ${action}`}>
                        {actionLabels[action]}
                    </div>
                )}
            </div>
            {(currentBet > 0 && !foldClass) && (
                <div className="poker-player-bet-chip">{currentBet}</div>
            )}
            {!folded && (
                <div className="player-pocket-cards">
                    {hand && hand.length > 0 ? (
                        hand.map((card, i) => (
                            <Card 
                                key={i} 
                                value={card} 
                                className="small-card flip-in"
                                style={{ animationDelay: `${i * 150}ms` }}
                            />
                        ))
                    ) : (
                        Array.from({ length: handSize || 0 }).map((_, i) => (
                            <CardBack key={i} className="small-card" />
                        ))
                    )}
                </div>
            )}
        </div>
    );
} 