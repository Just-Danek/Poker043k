import { useState } from 'react'
import { MenuScreen } from '../../home/ui/MenuScreen'
import { PokerScreen } from '../../game/ui/PokerScreen'
import LobbyScreen  from '../../lobby/ui/LobbyScreen'
import { StatsScreen } from '../../stats/ui/StatsScreen'
import CreateRoomForm from '../../../features/create-room/ui/CreateRoomForm'
import { useNavigationStore } from '../../../shared/models/navigation'
import { useRoomSessionActions } from '../../../features/room-session/lib/useRoomSessionActions'

export default function RootNavigator() {
    const currentScreen = useNavigationStore((state) => state.currentScreen);
    const goTo = useNavigationStore((state) => state.goTo);

    const [isCreatingRoom, setIsCreatingRoom] = useState(false);

    const { createRoom, joinRoom, startGame, leaveRoom } = useRoomSessionActions();

    const handleCreateRoomSubmit = (data: { name: string; maxPlayers: number; password?: string }) => {
        createRoom({
            name: data.name,
            maxPlayers: data.maxPlayers,
            password: data.password?.trim() || undefined,
        });
        setIsCreatingRoom(false);
    }

    const handleJoinRoom = (id: string, password?: string) => {
        joinRoom(id, password);
    }

    const handleStartGame = () => {
        startGame();
    }

    const handleExitGame = () => {
        leaveRoom();
        goTo('menu');
    }

    return (
        <>
            {currentScreen === 'menu' && (
                <MenuScreen
                    onCreateRoom={() => setIsCreatingRoom(true)}
                    onJoinRoom={() => goTo('lobby')}
                    onShowStats={() => goTo('stats')}
                />
            )}

            {currentScreen === 'lobby' && (
                <LobbyScreen onBack={() => goTo('menu')} onJoin={handleJoinRoom} />
            )}

            {currentScreen === 'stats' && <StatsScreen onBack={() => goTo('menu')} />}

            {currentScreen === 'game' && (
                <PokerScreen onBack={handleExitGame} onStartGame={handleStartGame} />
            )}

            <CreateRoomForm
                onSubmit={handleCreateRoomSubmit}
                onCancel={() => setIsCreatingRoom(false)}
                isOpen={isCreatingRoom}
            />
        </>
    );  
}
