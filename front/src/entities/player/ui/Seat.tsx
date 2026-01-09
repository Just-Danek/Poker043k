import './Seat.css';

interface SeatProps {
    className: string;
    showLoading: boolean;
}

export default function Seat({ className, showLoading }: SeatProps) {
    return (
        <div className={`poker-player-seat ${className}`}>
            {showLoading && (
                <div className={`poker-player-avatar poker-player-avatar--empty`}>
                    <div className="loading-dots">
                        {[0, 1, 2].map(i => <span key={`dot-${i}`} />)}
                    </div>
                </div>
            )}
        </div>
    );
};