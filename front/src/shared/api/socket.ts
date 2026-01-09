import { io } from 'socket.io-client';

const SOCKET_URL = typeof window !== 'undefined' ? window.location.origin : '';
const SOCKET_PATH = '/socket.io';
const SOCKET_TRANSPORTS = ['websocket'];

export const socket = io(SOCKET_URL, {
    path: SOCKET_PATH,
    transports: SOCKET_TRANSPORTS,
    autoConnect: false,
    secure: true, 
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
});

export const reconnectSocket = () => {
    if (socket.connected) socket.disconnect();

    setTimeout(() => {
        if (!socket.connected) {
            socket.connect();
        }
    }, 300);
};