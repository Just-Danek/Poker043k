import { useShallow } from 'zustand/react/shallow';
import { Modal } from '../../../shared/ui/Modal';
import { useGameStore } from '../../../entities/game/model/store';
import './ExitGameModal.css';

interface ExitGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function ExitGameModal({ isOpen, onClose, onConfirm }: ExitGameModalProps) {
    const isHost = useGameStore(useShallow(state => 
        state.players.find(p => p.isYou)?.isHost ?? false
    ));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isHost ? 'Закрыть комнату?' : 'Покинуть стол?'}>
            <p className="exit-modal-text">
                {isHost 
                    ? 'Вы — организатор. Если вы выйдете, организатором станет другой игрок.'
                    : 'Вы уверены? Ваши карты будут сброшены.'
                }
            </p>
            
            <div className="exit-modal-actions">
                <button className="exit-btn-cancel" onClick={onClose}>
                    Остаться
                </button>
                <button className="exit-btn-confirm" onClick={onConfirm}>
                    {isHost ? 'Закрыть' : 'Выйти'}
                </button>
            </div>
        </Modal>
    );
};