import type { ReactNode } from 'react';
import './OverlayCard.css'; // Сюда перенеси общие стили оверлеев (.winner-card, .game-over-overlay)

interface OverlayCardProps {
    title: string;
    children: ReactNode;
    onAction?: () => void;
    actionText?: string;
    className?: string;
}

export const OverlayCard = ({ title, children, onAction, actionText, className }: OverlayCardProps) => {
    return (
        <div className="overlay-backdrop">
            <div className={`overlay-card ${className || ''}`}>
                <div className="overlay-title">{title}</div>
                
                <div className="overlay-content">
                    {children}
                </div>

                {Boolean(onAction) && actionText && (
                    <button className="overlay-btn" onClick={onAction}>
                        {actionText}
                    </button>
                )}
            </div>
        </div>
    );
};