import { useState, useEffect } from 'react';
import { Modal } from '../../../shared/ui/Modal';
import './PasswordJoinModal.css'

interface PasswordJoinModalProps {
    isOpen: boolean;
    roomName: string;
    onClose: () => void;
    onConfirm: (password: string) => void;
}

export default function PasswordJoinModal({ isOpen, roomName, onClose, onConfirm }: PasswordJoinModalProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Введите пароль');
            return;
        }
        onConfirm(password.trim());
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Вход: ${roomName}`}>
            <form className="password-form" onSubmit={handleSubmit}>
                <label className="password-label">Эта комната защищена паролем</label>
                <input
                    type="password"
                    className="password-input"
                    placeholder="Пароль..."
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                    }}
                    autoFocus
                />
                
                {error && <span className="password-error">{error}</span>}
                
                <div className="password-actions">
                    <button type="button" className="password-cancel" onClick={onClose}>
                        Отмена
                    </button>
                    <button type="submit" className="password-submit">
                        Войти
                    </button>
                </div>
            </form>
        </Modal>
    );
};