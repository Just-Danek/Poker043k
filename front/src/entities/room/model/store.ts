import { create } from 'zustand';

interface RoomState {
    roomId: string | null;
    config: { maxPlayers: number } | null;
    setRoomId: (id: string | null) => void;
    setRoomConfig: (config: { maxPlayers: number } | null) => void;
    reset: () => void;
}

const initialRoomState: Pick<RoomState, 'roomId' | 'config'> = {
    roomId: null,
    config: null,
}

export const useRoomStore = create<RoomState>((set) => ({
    ...initialRoomState,
    setRoomId: (roomId) => set({ roomId }),
    setRoomConfig: (config) => set({ config }),
    reset: () => set({ ...initialRoomState }),
}));