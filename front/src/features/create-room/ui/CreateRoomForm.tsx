// import { useState } from 'react';
// import './CreateRoomForm.css';

// interface CreateRoomData {
//     name: string;
//     password?: string;
//     maxPlayers: number;
// }

// interface CreateRoomFormProps {
//     onSubmit: (data: CreateRoomData) => void;
//     onCancel: () => void;
// }

// export default function CreateRoomForm({ onSubmit, onCancel }: CreateRoomFormProps) {
//     const [name, setName] = useState('');
//     const [password, setPassword] = useState('');
//     const [maxPlayers, setMaxPlayers] = useState<number>(6);

//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!name.trim()) return;
        
//         onSubmit({
//             name,
//             password: password || undefined,
//             maxPlayers,
//         });
//     };

//     return (
//         <div className="cr-overlay">
//             <div className="cr-modal">
//                 <h2 className="cr-title">Создать комнату</h2>
                
//                 <form onSubmit={handleSubmit} className="cr-form">
//                     <div className="cr-field">
//                         <label className="cr-label">Название стола</label>
//                         <input
//                             type="text"
//                             className="cr-input"
//                             placeholder="Введите название"
//                             value={name}
//                             onChange={(e) => setName(e.target.value)}
//                             required
//                         />
//                     </div>

//                     <div className="cr-field">
//                         <label className="cr-label">Пароль (необязательно)</label>
//                         <input
//                         type="password"
//                         className="cr-input"
//                         placeholder="Введите пароль"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         />
//                     </div>

//                     <div className="cr-field">
//                         <label className="cr-label">Количество игроков</label>
//                         <div className="cr-players-selector">
//                         {[2, 3, 4, 5, 6].map((num) => (
//                             <button
//                                 key={num}
//                                 type="button"
//                                 className={`cr-player-btn ${maxPlayers === num ? 'active' : ''}`}
//                                 onClick={() => setMaxPlayers(num)}
//                             >
//                                 {num}
//                             </button>
//                         ))}
//                         </div>
//                     </div>

//                     <div className="cr-actions">
//                         <button type="button" className="cr-btn-cancel" onClick={onCancel}>
//                             Отмена
//                         </button>
//                         <button type="submit" className="cr-btn-submit" disabled={!name.trim()}>
//                             Создать
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }

import { useEffect, useState } from 'react';
import { Modal } from '../../../shared/ui/Modal';
import './CreateRoomForm.css';

interface CreateRoomData {
    name: string;
    password?: string;
    maxPlayers: number;
}

interface CreateRoomFormProps {
    isOpen: boolean;
    onSubmit: (data: CreateRoomData) => void;
    onCancel: () => void;
}

export default function CreateRoomForm({ isOpen, onSubmit, onCancel }: CreateRoomFormProps) {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [maxPlayers, setMaxPlayers] = useState<number>(6);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setPassword('');
            setMaxPlayers(6);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || isSubmitting) return;
        setIsSubmitting(true);

        Promise.resolve(onSubmit({ name, password: password || undefined, maxPlayers }))
            .catch((error) => {
                console.error('Failed to create room', error);
            })
            .finally(() => setIsSubmitting(false));
    };

    return (
        <Modal isOpen={isOpen} onClose={onCancel} title="Создать комнату">
            <form onSubmit={handleSubmit} className="cr-form">
                <div className="cr-field">
                    <label className="cr-label">Название стола</label>
                    <input
                        type="text"
                        className="cr-input"
                        placeholder="Введите название"
                        value={name}
                        maxLength={15}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="cr-field">
                    <label className="cr-label">Пароль (необязательно)</label>
                    <input
                        type="password"
                        className="cr-input"
                        placeholder="Введите пароль"
                        value={password}
                        maxLength={10}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            
                <div className="cr-field">
                    <label className="cr-label">Количество игроков</label>
                    <div className="cr-players-selector">
                        {[2, 3, 4, 5, 6].map((num) => (
                            <button
                                key={num}
                                type="button"
                                className={`cr-player-btn ${maxPlayers === num ? 'active' : ''}`}
                                onClick={() => setMaxPlayers(num)}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="cr-actions">
                    <button type="button" className="cr-btn-cancel" onClick={onCancel}>
                        Отмена
                    </button>
                    <button type="submit" className="cr-btn-submit" disabled={!name.trim() || isSubmitting}>
                        Создать
                    </button>
                </div>
            </form>
        </Modal>
    );
};