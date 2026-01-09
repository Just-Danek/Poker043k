import { Lock, Users } from 'lucide-react';
import type { RoomInfo } from '../../../shared/api/game';
import './RoomCard.css';

interface RoomCardProps {
    room: RoomInfo;
    onClick: () => void;
}

export default function RoomCard({ room, onClick }: RoomCardProps) {
    return (
        <div className="room-card" onClick={onClick}>
            <div className="room-info">
                <div className="room-name">{room.name}</div>
                <div className={`room-status ${room.status}`}>
                    {room.status === 'waiting' ? 'Ожидание' : 'Игра идет'}
                </div>
            </div>
            
            <div className="room-meta">
                {room.hasPassword && (
                    <div className="room-lock">
                        <Lock size={14} />
                        <span>по паролю</span>
                    </div>
                )}
                <div className="room-players">
                    <Users size={14} />
                    <span>{room.currentPlayers}/{room.maxPlayers}</span>
                </div>
                <button className="room-join-btn">ВОЙТИ</button>
            </div>
        </div>
    );
};