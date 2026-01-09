import Card from '../../card/ui/Card';
import './BoardCenter.css';

interface BoardCenterProps {
    potTotal: number;
    communityCards: string[];
}

export default function BoardCenter({ potTotal, communityCards }: BoardCenterProps) {
    return (
        <div className="board-center">
            <div className="board-pot-total">
                <span className="label">БАНК</span>
                <span className="value">{potTotal}</span>
            </div>

            <div className="board-community">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div key={`c-${i}`} className="board-card-placeholder">
                        {communityCards[i] && (
                            <Card value={communityCards[i]} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};