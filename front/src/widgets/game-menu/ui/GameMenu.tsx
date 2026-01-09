import { ArrowLeft } from 'lucide-react';
import IconButton from '../../../shared/ui/IconButton';
import './GameMenu.css';

interface GameMenuProps {
    onOpenExit: () => void;
    onOpenHelp: () => void;
    isHelpActive: boolean;
}

export default function GameMenu({ onOpenExit, onOpenHelp, isHelpActive }: GameMenuProps) {
    return (
        <div className="game-menu">
            <IconButton 
                icon={<ArrowLeft size={24} />} 
                onClick={onOpenExit} 
            />
            
            <IconButton 
                icon={<span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>?</span>}
                onClick={onOpenHelp}
                isActive={isHelpActive}
            />
        </div>
    );
};