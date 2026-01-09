import type { ReactNode } from 'react';
import './IconButton.css';

interface IconButtonProps {
    icon: ReactNode;
    onClick: () => void;
    isActive?: boolean;
    className?: string;
}

export default function IconButton({ icon, onClick, isActive, className }: IconButtonProps) {
    return (
        <button 
            className={`icon-btn ${isActive ? 'active' : ''} ${className || ''}`}
            onClick={onClick}
        >
            {icon}
        </button>
    );
};