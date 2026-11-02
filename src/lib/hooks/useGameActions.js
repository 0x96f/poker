import { useCallback } from 'react';
import { emitVote, emitReveal, emitReset } from '@/lib/socket';
export function useGameActions({
  socket,
  gameId,
  userId,
  selectedVote,
  setSelectedVote,
  revealed,
}) {
  // Only apply the optimistic local selection when the vote can actually reach
  // the server (connected socket, round not revealed). Otherwise the local
  // state would diverge from the authoritative server state until resync.
  const handleCardClick = useCallback(
    (value) => {
      if (revealed || !socket?.connected || !userId) return;
      const newVote = selectedVote === value ? null : value;
      setSelectedVote(newVote);
      emitVote(socket, gameId, userId, newVote);
    },
    [socket, userId, gameId, selectedVote, setSelectedVote, revealed]
  );
  const handleReveal = useCallback(() => {
    if (socket) emitReveal(socket, gameId);
  }, [socket, gameId]);
  const handleReset = useCallback(() => {
    if (socket) emitReset(socket, gameId);
  }, [socket, gameId]);
  return {
    handleCardClick,
    handleReveal,
    handleReset,
  };
}
