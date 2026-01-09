import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import { useGameStore } from '../../../entities/game/model/store';
import { usePlayerActions } from '../lib/usePlayerActions';
import type { PlayerAction } from '../../../shared/api/game';
import RaiseSlider from './RaiseSlider';
import './GameControls.css'; 

type ActionButton = Exclude<PlayerAction, 'bet' | 'all-in' | 'none'>;
const ACTIONS: ActionButton[] = ['fold', 'check', 'call', 'raise'];

export const GameControls = () => {
    const { currentBet, activePlayerIndex, players, stage, winnerInfo } = useGameStore(useShallow((state) => ({
        currentBet: state.currentBet,
        activePlayerIndex: state.activePlayerIndex,
        players: state.players,
        stage: state.stage,
        winnerInfo: state.winners,
    })));
    const { sendAction } = usePlayerActions();

    const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);

    const hero = players.find((player) => player.isYou);
    const activePlayer = players[activePlayerIndex];
    const isHeroTurn = hero && activePlayer && hero.id === activePlayer.id;

    if (!hero) return null;

    useEffect(() => {
        if (!isHeroTurn || winnerInfo) setIsRaiseModalOpen(false);
    }, [isHeroTurn, winnerInfo, stage]); 

    const canCheck = hero.currentBet >= currentBet;
    const callAmount = Math.max(currentBet - hero.currentBet, 0);
    const minRaise = Math.max(currentBet * 2, 100); 
    const maxRaise = hero.chips || 0;

    const confirmRaise = (amount: number) => {
        sendAction({ type: 'raise', amount });
        setIsRaiseModalOpen(false);
    };

    return (
        <>
            <div className="game-controls-actions">
                {ACTIONS.map((action) => {
                    if (action === 'check' && !canCheck) return null;
                    if (action === 'call' && canCheck) return null;
                    
                    return (
                        <button
                            key={action} 
                            className={`poker-btn poker-btn--${action}`}
                            disabled={!isHeroTurn}
                            onClick={() => action === 'raise' ? setIsRaiseModalOpen(true) : sendAction({ type: action })}
                        >
                            {action.toUpperCase()} {action === 'call' && callAmount > 0 ? callAmount : ''}
                        </button>
                    )
                })}
            </div>

            {isRaiseModalOpen && (
                <RaiseSlider 
                    min={minRaise} 
                    max={maxRaise} 
                    onCancel={() => setIsRaiseModalOpen(false)}
                    onConfirm={confirmRaise}
                />
            )}
        </>
    );
};