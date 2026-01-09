import { useState } from 'react';
import { reconnectSocket } from '../../../shared/api/socket';
import { useShallow } from 'zustand/shallow';
import { useSocketStatusStore } from '../lib/socketStatus';
import './ReconnectBanner.css';

export function ReconnectBanner() {
    const { isConnected, lastError, setError} = useSocketStatusStore(
        useShallow((state) => ({
            isConnected: state.isConnected,
            lastError: state.lastError,
            setError: state.setError,
        }))
    );

    const [isReconnectingLocal, setIsReconnectingLocal] = useState(false);

    if (isConnected) return null;
    const handleReconnectClick = () => {
        if (isReconnectingLocal) return;
        
        setIsReconnectingLocal(true);
        setError(null);

        reconnectSocket();
        setTimeout(() => {
            setIsReconnectingLocal(false);
        }, 5000);
    };


    return (
        <div className="reconnect-banner">
            <div className="reconnect-banner__text">
                <strong>Проблемы с подключением.</strong>
                <span>{lastError || 'Проверь интернет или попробуй переподключиться.'}</span>
            </div>
            <button
                type="button"
                className="reconnect-banner__button"
                onClick={handleReconnectClick}
                disabled={isReconnectingLocal}
            >
                {isReconnectingLocal ? 'Подключаем...' : 'Переподключить'}
            </button>
        </div>
    );
}
