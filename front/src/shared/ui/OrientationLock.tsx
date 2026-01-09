import { RefreshCcw } from 'lucide-react';
import './OrientationLock.css';

interface OrientationLockProps {
    onRefresh?: () => void;
}

export default function OrientationLock({ onRefresh }: OrientationLockProps) {
    const handleRefresh = () => {
        if (onRefresh) onRefresh();
    };

    return (
        <div className="orientation-lock">
            <RefreshCcw color="#fbbf24" size={64} />
            <p className="orientation-text">Пожалуйста, поверните устройство горизонтально</p>
            <button className="refresh-text" type="button" onClick={handleRefresh}>
                обновить отображение
            </button>
        </div>
    );
}