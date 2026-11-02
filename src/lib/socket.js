import { useEffect, useRef, useSyncExternalStore } from 'react';
import { GameSocket } from './game-socket';
import { useGameStore } from './store';
import { getVoteForUser } from './vote-utils';
const USER_ID_KEY = 'planning-poker-user-id';
function getUserId() {
  if (typeof window === 'undefined') return '';
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}
// Identifies a distinct join-game payload. Used to dedup redundant joins.
function joinKey(username) {
  return username ?? '';
}
/**
 * JOIN-GAME RULES
 *
 * There are two scenarios that send a 'join-game' event to the server:
 *
 * 1. CONNECT/RECONNECT — the socket's 'connect' event fires.
 *    This always sends join-game, even without a displayName.
 *    The server resolves the username from its stored profile using the userId.
 *    This handles: initial page load (returning user), page refresh, tab reconnect.
 *
 * 2. DISPLAY NAME CHANGE — the displayName prop changes while already connected.
 *    This happens when: the user submits the join form, or renames themselves.
 *    It sends join-game with the new displayName so the server updates the profile.
 *
 * DEDUP: Both paths record the payload they sent via `lastJoinKeyRef`. The
 * displayName effect (scenario 2) skips emitting when the current key already
 * matches the last one sent, so it never duplicates the connect handler's join.
 * Because it compares actual payloads (not a one-shot flag), a rename that
 * happens after a reconnect is still emitted correctly.
 */
export function useSocket(gameId, displayName, shouldConnect = true, cardSet) {
  const socketRef = useRef(null);
  const listenersRef = useRef(new Set());
  const displayNameRef = useRef(displayName);
  const cardSetRef = useRef(cardSet);
  const lastJoinKeyRef = useRef(null);
  useEffect(() => {
    displayNameRef.current = displayName;
    cardSetRef.current = cardSet;
  }, [displayName, cardSet]);
  const {
    setCurrentUserId,
    setCurrentUserName,
    setUsers,
    setVotes,
    setRevealed,
    setSelectedVote,
    setCardSet,
  } = useGameStore();
  const subscribe = (callback) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  };
  const getSnapshot = () => {
    return socketRef.current;
  };
  // --- Socket lifecycle effect: create, connect, listen, cleanup ---
  useEffect(() => {
    if (!gameId || !shouldConnect) return;
    const listeners = listenersRef.current;
    const userId = getUserId();
    const emitJoinGame = (socket) => {
      lastJoinKeyRef.current = joinKey(displayNameRef.current);
      socket.emit('join-game', {
        gameId,
        userId,
        username: displayNameRef.current,
        cardSet: cardSetRef.current,
      });
    };
    const newSocket = new GameSocket(gameId);
    socketRef.current = newSocket;
    listeners.forEach((listener) => listener());
    newSocket.on(
      'user-joined',
      ({
        userId: joinedUserId,
        username,
        users,
        votes,
        revealed,
        cardSet: serverCardSet,
      }) => {
        setCurrentUserId(joinedUserId);
        setCurrentUserName(username ?? '');
        setUsers(users);
        setVotes(votes);
        setRevealed(revealed);
        // Only adopt the server's card set when it actually sent one. An empty
        // value means "no change" (e.g. a presence-only join response) and must
        // not clobber a card set we already have. Cross-game staleness is
        // handled by resetting the card set when the gameId changes (GameApp.jsx).
        if (serverCardSet) {
          setCardSet(serverCardSet);
        }
        const userVote = getVoteForUser(votes, joinedUserId);
        setSelectedVote(userVote ?? null);
      }
    );
    // Scenario 1: connect/reconnect — always join, server resolves username from profile
    newSocket.on('connect', () => {
      console.log('Socket connected');
      emitJoinGame(newSocket);
    });
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    newSocket.on('user-list-updated', ({ users }) => {
      setUsers(users);
    });
    newSocket.on('votes-revealed', ({ votes, revealed }) => {
      setVotes(votes);
      setRevealed(revealed);
    });
    newSocket.on('votes-reset', ({ users }) => {
      useGameStore.setState({
        selectedVote: null,
        votes: [],
        revealed: false,
        users,
      });
    });
    newSocket.on(
      'card-set-updated',
      ({ cardSet: updatedCardSet, invalidatedUserIds }) => {
        setCardSet(updatedCardSet);
        if (invalidatedUserIds?.length) {
          const currentUserId = useGameStore.getState().currentUserId;
          if (invalidatedUserIds.includes(currentUserId)) {
            setSelectedVote(null);
          }
        }
      }
    );
    newSocket.connect();
    return () => {
      lastJoinKeyRef.current = null;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      listeners.forEach((listener) => listener());
    };
  }, [
    gameId,
    shouldConnect,
    setCurrentUserId,
    setCurrentUserName,
    setUsers,
    setVotes,
    setRevealed,
    setSelectedVote,
    setCardSet,
  ]);
  // --- Scenario 2: displayName changed while already connected ---
  useEffect(() => {
    if (!displayName || !socketRef.current?.connected) return;
    // Skip if this exact payload was already sent (e.g. by the connect handler).
    const key = joinKey(displayName);
    if (key === lastJoinKeyRef.current) return;
    lastJoinKeyRef.current = key;
    socketRef.current.emit('join-game', {
      gameId,
      userId: getUserId(),
      username: displayName,
      cardSet: cardSetRef.current,
    });
  }, [gameId, displayName]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
function isConnected(socket) {
  return socket !== null && socket.connected;
}
export function emitVote(socket, gameId, userId, vote) {
  if (isConnected(socket)) {
    socket.emit('vote', { gameId, userId, vote });
  }
}
export function emitReveal(socket, gameId) {
  if (isConnected(socket)) {
    socket.emit('reveal-votes', { gameId });
  }
}
export function emitReset(socket, gameId) {
  if (isConnected(socket)) {
    socket.emit('reset-votes', { gameId });
  }
}
export function emitThrowEmoji(socket, gameId, targetUserId, emoji) {
  if (isConnected(socket)) {
    socket.emit('throw-emoji', { gameId, targetUserId, emoji });
  }
}
