import { create } from 'zustand';

interface SocketStatusState {
    isConnected: boolean;
    isReconnecting: boolean;
    lastError: string | null;
    setConnected: (isConnected: boolean) => void;
    setError: (message: string | null) => void;
    setReconnecting: (state: boolean) => void;
}

export const useSocketStatusStore = create<SocketStatusState>((set) => ({
    isConnected: true,
    isReconnecting: false,
    lastError: null,
    setConnected: (isConnected) => set({ isConnected }),
    setError: (message) => set({ lastError: message }),
    setReconnecting: (state) => set({ isReconnecting: state }),
}));
