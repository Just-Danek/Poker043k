import { useGameStore } from '../../../entities/game/model/store';
import Card from '../../../entities/card/ui/Card';
import './HeroHand.css';

export default function HeroHand() {
    const playerCards = useGameStore(state => state.playerCards);

    return (
        <div className="hero-hand">
            {playerCards.map((card, i) => (
                <Card 
                    key={`h-${i}`}
                    value={card}
                    style={{ transform: `rotate(${i === 0 ? -3 : 3}deg) translate(${i === 0 ? -2 : 2}px, 0)` }}
                    isHero
                />
            ))}
        </div>
    );
}