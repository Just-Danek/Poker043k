import { useUserStats } from '../../../entities/viewer/lib/useUserStats';
import StatsCard from '../../../entities/viewer/ui/StatsCard';
import { CARDS_PARAMS } from '../lib/constants';
import Header from '../../../shared/ui/Header'
import './StatsScreen.css';

interface StatsScreenProps {
    onBack: () => void;
}

export function StatsScreen({ onBack }: StatsScreenProps) {
    const { stats, isLoading, refresh } = useUserStats();

    return (
        <div className="stats-screen">
            <Header 
                title='Статистика'
                onBack={onBack}
                refresh={refresh}
                isLoading={isLoading}
            />

            <div className="stats-content">
                {isLoading || !stats ? (
                    <div className="stats-loading">
                        <div className="loading-dots"><span/><span/><span/></div>
                    </div>
                ) : (
                    <div className="stats-grid">
                        {CARDS_PARAMS.map((card) => {
                            const rawValue = stats[card.key as keyof typeof stats];
                            const displayValue = card.format ? card.format(rawValue) : rawValue;

                            return <StatsCard 
                                key={card.key}
                                label={card.label}
                                icon={<card.icon size={20} color={card.color}/>}
                                value={displayValue}
                                className={card.highlight ? 'highlight-card' : ''}
                            />
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}