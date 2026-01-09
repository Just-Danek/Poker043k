import { Play, BarChart3, LogIn } from 'lucide-react';
import './MenuScreen.css';

interface MenuScreenProps {
    onCreateRoom: () => void;
    onJoinRoom: () => void;
    onShowStats: () => void;
}

export function MenuScreen({ onCreateRoom, onJoinRoom, onShowStats }: MenuScreenProps) {
    return (
        <div className="menu-screen">
            <div className="menu-screen-intro">
                <h1 className="menu-screen-title">POKERO4EK</h1>
                <p className="menu-screen-subtitle">LAST DODEP</p>
            </div>

            <div className="menu-screen-actions">
                {['СОЗДАТЬ КОМНАТУ', 'ПРИСОЕДИНИТЬСЯ', 'МОЯ СТАТИСТИКА'].map((text, index) => (
                    <button 
                        key={text} 
                        className={`menu-screen-button ${index === 0 ? '--primary' : '--secondary'}`} 
                        onClick={index === 0 ? onCreateRoom : index === 1 ? onJoinRoom : onShowStats}
                    >
                        {index === 0 && <Play size={20} />}
                        {index === 1 && <LogIn size={20} />}
                        {index === 2 && <BarChart3 size={20} />}
                        <span>{text}</span>
                    </button>
                ))}
            </div>

            <div className="menu-screen-footer">TEXAS HOLD'EM</div>
        </div>
    );
}
