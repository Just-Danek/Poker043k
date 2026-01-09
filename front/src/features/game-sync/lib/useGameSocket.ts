import { useEffect, useRef } from 'react';
import { socket } from '../../../shared/api/socket';
import { useGameStore } from '../../../entities/game/model/store';
import { useNavigationStore } from '../../../shared/models/navigation';
import { useRoomStore } from '../../../entities/room/model/store';
import { useSocketStatusStore } from './socketStatus';
import { notify } from '../../../shared/lib/notifications';
import type {
  GameOverPayload,
  GameUpdatePayload,
  PlayersUpdatePayload,
  RoomUpdatePayload,
  RoundEndedPayload,
  ServerPlayerSnapshot,
  SocketErrorPayload,
} from '../../../shared/api/game';

const mapPlayers = (players: ServerPlayerSnapshot[]) =>
  players.map((player) => ({
    ...player,
    isYou: player.socketId === socket.id,
  }));

export const useGameSocket = () => {
  const { setGameState, setPlayers, setWinners, setGameOverData, resetGame } = useGameStore();
  const { setRoomId, setRoomConfig } = useRoomStore();
  const { goTo } = useNavigationStore();
  const setConnected = useSocketStatusStore((state) => state.setConnected);
  const setError = useSocketStatusStore((state) => state.setError);
  const setReconnecting = useSocketStatusStore((state) => state.setReconnecting);

  const isConnected = useRef(false);
  const winnersTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hadConnectionIssueRef = useRef(false);

  useEffect(() => {
    if (!isConnected.current) {
      if (!socket.connected) {
        console.log('🔌 Socket init...');
        socket.connect();
      }
      isConnected.current = true;
    }
    setError(null);

    const handleRoomUpdate = (data: RoomUpdatePayload) => {
      resetGame();
      setRoomConfig({ maxPlayers: data.maxPlayers });
      setRoomId(data.roomId);
      setPlayers(mapPlayers(data.players));

      if (data.gameState) setGameState(data.gameState);
      goTo('game');
    };

    const onUpdatePlayers = (data: PlayersUpdatePayload) => {
      setPlayers(mapPlayers(data.players));
    };

    const onGameUpdate = (data: GameUpdatePayload) => {
      setGameState(data.gameState);
      if (data.players) {
        setPlayers(mapPlayers(data.players));
      }
    };

    const onRoundEnded = (data: RoundEndedPayload) => {
      setWinners({
        winners: data.winners,
        amount: data.amount,
        combination: data.combination,
      });
      if (winnersTimeoutRef.current) {
        clearTimeout(winnersTimeoutRef.current);
      }
      winnersTimeoutRef.current = setTimeout(() => setWinners(null), 4000);
    };

    const onGameOver = (data: GameOverPayload) => {
      setGameOverData(data);
    };

    const handleConnect = () => {
      setConnected(true);
      setReconnecting(false);
      setError(null);
      if (hadConnectionIssueRef.current) {
        notify.info('Соединение восстановлено');
        hadConnectionIssueRef.current = false;
      }
    };

    const handleDisconnect = (reason?: string) => {
      if (reason === 'io client disconnect') return;
      setConnected(false);
      setReconnecting(false);
      setError(reason || 'Соединение разорвано');
      hadConnectionIssueRef.current = true;
    };

    const handleConnectError = (err: Error) => {
      const message = err?.message || 'Не удалось подключиться к серверу';
      setConnected(false);
      setReconnecting(false);
      setError(message);
      hadConnectionIssueRef.current = true;
      notify.error(message);
    };

    const onError = (err: SocketErrorPayload) => {
      const message = err?.message || 'Произошла ошибка соединения';
      setError(message);
      setReconnecting(false);
      hadConnectionIssueRef.current = true;
      notify.error(message);
    };

    const handleReconnectAttempt = (attempt: number) => {
      setReconnecting(true);
      setError(`Пытаемся переподключиться (${attempt})...`);
    };

    const handleReconnectError = (err: Error) => {
      const message = err?.message || 'Ошибка переподключения';
      setError(message);
      setReconnecting(false);
      hadConnectionIssueRef.current = true;
    };

    const handleReconnectFailed = () => {
      setReconnecting(false);
      setError('Переподключение не удалось');
    };

    socket.on('room_created', handleRoomUpdate);
    socket.on('room_joined', handleRoomUpdate);
    socket.on('update_players', onUpdatePlayers);
    socket.on('game_updated', onGameUpdate);
    socket.on('round_ended', onRoundEnded);
    socket.on('game_over', onGameOver);
    socket.on('error', onError);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect_error', handleReconnectError);
    socket.on('reconnect_failed', handleReconnectFailed);

    return () => {
      socket.off('room_created', handleRoomUpdate);
      socket.off('room_joined', handleRoomUpdate);
      socket.off('update_players', onUpdatePlayers);
      socket.off('game_updated', onGameUpdate);
      socket.off('round_ended', onRoundEnded);
      socket.off('game_over', onGameOver);
      socket.off('error', onError);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect_error', handleReconnectError);
      socket.off('reconnect_failed', handleReconnectFailed);

      if (winnersTimeoutRef.current) {
        clearTimeout(winnersTimeoutRef.current);
      }

      if (socket.connected) {
        socket.disconnect();
      }
      isConnected.current = false;
    };
  }, []);
};