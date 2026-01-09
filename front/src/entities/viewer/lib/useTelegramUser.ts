import { useEffect } from 'react';
import { useViewerStore } from '../model/store';

export const useTelegramUser = () => {
    const setViewerId = useViewerStore((state) => state.setViewerId);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tg = (window as any).Telegram?.WebApp;
        
        if (tg) {
            tg.ready();
            tg.expand();
            tg.requestFullscreen();
            tg.disableVerticalSwipes();
            tg.enableClosingConfirmation();
            
            tg.setHeaderColor('#020617');
            tg.setBackgroundColor('#020617');
            tg.setBottomBarColor('#020617');
            
            const user = tg.initDataUnsafe?.user;
            if (user) {
                setViewerId(user.id, user.username || user.first_name || 'Anon');
            } else {
                const randomId = Math.floor(Math.random() * 10000);
                setViewerId(randomId, `Guest_${randomId}`);
            }
        }
    }, [setViewerId]);
};