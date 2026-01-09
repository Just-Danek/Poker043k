type TelegramWebApp = {
    showAlert?: (message: string) => void;
    showPopup?: (options: { title?: string; message: string; buttons?: {id: string; type?: 'default' | 'destructive'; text: string;}[] }) => void;
};

const getTelegram = (): TelegramWebApp | undefined => {
    if (typeof window === 'undefined') return undefined;
    return (window as any)?.Telegram?.WebApp;
};

const showMessage = (message: string, title?: string) => {
    const tg = getTelegram();
    if (tg?.showPopup) {
        tg.showPopup({ title, message, buttons: [{ id: 'ok', text: 'Ок' }] });
        return;
    }
    if (tg?.showAlert) {
        tg.showAlert(message);
        return;
    }
    if (title) console.log(`${title}: ${message}`);
    else console.log(message);
};

export const notify = {
    info(message: string) {
        showMessage(message);
    },
    error(message: string) {
        showMessage(message, 'Ошибка');
    },
};