import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useGameStore } from '../../../entities/game/model/store';
import PokerTable from '../../../widgets/poker-table/ui/PokerTable';
import GameNotifications from '../../../widgets/game-notifications/ui/GameNotifications';
import ExitGameModal from '../../../features/exit-game/ui/ExitGameModal';
import HandRankingModal from '../../../features/hand-ranking-modal/ui/HandRankingModal';
import HeroHand from '../../../widgets/hero-hand/ui/HeroHand';
import OrientationLock from '../../../shared/ui/OrientationLock';
import SideBar from '../../../widgets/sidebar/ui/SideBar';
import GameMenu from '../../../widgets/game-menu/ui/GameMenu';
import './PokerScreen.css';

interface PokerScreenProps {
    onBack: () => void;
    onStartGame: () => void;
}
type ModalType = 'none' | 'help' | 'exit';

export function PokerScreen({ onBack, onStartGame }: PokerScreenProps) {
    const { 
        gameOverData,
        status,
    } = useGameStore(useShallow(state => ({
        gameOverData: state.gameOverData,
        status: state.status,
    })));
    
    const isWaiting = status === 'waiting';
    const isFinished = status === 'finished';
    const [activeModal, setActiveModal] = useState<ModalType>('none');
    const [needsRotation, setNeedsRotation] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).Telegram?.WebApp) (window as any).Telegram.WebApp.expand();
    }, []); 

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const media = window.matchMedia('(orientation: portrait) and (max-width: 768px)');
        const updateOrientation = () => setNeedsRotation(media.matches);
        updateOrientation();

        if (media.addEventListener) media.addEventListener('change', updateOrientation);
        
        return () => {
            if (media.removeEventListener) media.removeEventListener('change', updateOrientation);
        };
    }, []);

    const handleRefresh = useMemo(() => () => {
        if (typeof window !== 'undefined') window.location.reload();
    }, []);

    if (needsRotation) {
        return <OrientationLock onRefresh={handleRefresh} />;
    }

    return (
        <>
            <div className="poker-screen">
                <div className="poker-screen-game-area">       
                    <GameMenu
                        onOpenExit={() => setActiveModal('exit')}
                        onOpenHelp={() => setActiveModal('help')}
                        isHelpActive={activeModal === 'help'}
                    />

                    <PokerTable onStartGame={onStartGame} />
                    {!isWaiting && <HeroHand />} 
                </div>

                <GameNotifications onBackToMenu={onBack} />

                {!isWaiting && !isFinished && !gameOverData && <SideBar />}

                <ExitGameModal 
                    isOpen={activeModal === 'exit'}
                    onClose={() => setActiveModal('none')}
                    onConfirm={() => {
                        setActiveModal('none');
                        onBack();
                    }}                
                />

                <HandRankingModal
                    isOpen={activeModal === 'help'}
                    onClose={() => setActiveModal('none')}
                />
            </div>
        </>
    );
}