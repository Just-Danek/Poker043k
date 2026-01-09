import type { ReactNode } from 'react';
import './StatsCard.css'; 

interface StatsCardProps {
    label: string;
    value: string | number;
    icon?: ReactNode;
    className?: string;
}

export default function StatsCard({ label, value, icon, className }: StatsCardProps) {
    return (
        <div className={`stats-card ${className || ''}`}>
            <div className="stats-card-header">
                <span className="stats-label">{label}</span>
                {icon && <div className="stats-icon">{icon}</div>}
            </div>
            <div className="stats-value">{value}</div>
        </div>
    );
};