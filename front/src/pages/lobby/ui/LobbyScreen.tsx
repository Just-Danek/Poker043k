import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { RoomInfo } from '../../../shared/api/game';
import { useLobbyRooms } from '../../../features/lobby/lib/useLobbyRooms';
import './LobbyScreen.css';
import PasswordJoinModal from '../../../features/join-room/ui/PasswordJoinModal';
import RoomCard from '../../../entities/room/ui/RoomCard';
import Header from '../../../shared/ui/Header'

interface LobbyScreenProps {
    onBack: () => void;
    onJoin: (roomId: string, password?: string) => void;
}

export default function LobbyScreen({ onBack, onJoin }: LobbyScreenProps) {
    const { rooms, isLoading, refresh } = useLobbyRooms();
    const [searchQuery, setSearchQuery] = useState('');
    const [, setPasswordModalOpen] = useState(false);
    const [, setPasswordValue] = useState('');
    const [, setPasswordError] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);

    const filteredRooms = useMemo(
        () => rooms.filter((room) => room.name.toLowerCase().includes(searchQuery.toLowerCase())),
        [rooms, searchQuery],
    );

    const handleCardClick = (room: RoomInfo) => {
        if (room.hasPassword) setSelectedRoom(room);
        else onJoin(room.roomId); 
    };

    const closePasswordModal = () => {
        setPasswordModalOpen(false);
        setPasswordValue('');
        setPasswordError('');
        setSelectedRoom(null);
    };

    const handleConfirmPassword = (password: string) => {
        if (!selectedRoom) return;
        if (!password.trim()) {
            setPasswordError('Введите пароль для доступа');
            return;
        }
        onJoin(selectedRoom.roomId, password.trim());
        closePasswordModal();
    };

    return (
        <div className="lobby-screen">
            <Header 
                title='Комнаты'
                onBack={onBack}
                refresh={refresh}
                isLoading={isLoading}
            />

            <div className="lobby-search-container">
                <Search className="search-icon" size={18} />
                <input 
                type="text" 
                className="lobby-search-input"
                placeholder="Поиск комнаты..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="lobby-list">
                {isLoading ? (
                    <div className="lobby-loading">Загрузка...</div>
                ) : filteredRooms.length === 0 ? (
                    <div className="lobby-empty">
                        <p>Нет доступных комнат</p>
                        <span>Создайте свою в главном меню!</span>
                    </div>
                ) : (
                    filteredRooms.map((room) => (
                        <RoomCard 
                            key={room.roomId}
                            room={room}
                            onClick={() => handleCardClick(room)}
                        />
                    ))
                )}
            </div>

            <PasswordJoinModal 
                isOpen={selectedRoom !== null}
                roomName={selectedRoom?.name || ''}
                onClose={() => setSelectedRoom(null)}
                onConfirm={handleConfirmPassword}
            />
        </div>
    );
}