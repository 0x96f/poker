import styles from './page.module.css';
import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { useSocket } from '@/lib/socket';
import { useGameActions } from '@/lib/hooks/useGameActions';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import { useConfetti } from '@/lib/hooks/useConfetti';
import { useConfettiOrigin } from '@/lib/hooks/useConfettiOrigin';
import { useEmojiAnimations } from '@/lib/hooks/useEmojiAnimations';
import { PokerTable } from '@/components/PokerTable/PokerTable';
import { JoinGameForm } from '@/components/JoinGameForm/JoinGameForm';
import { GameHeader } from '@/components/GameHeader/GameHeader';
import { ConfettiContainer } from '@/components/ConfettiContainer/ConfettiContainer';
import { Toast } from '@/components/Toast/Toast';
import { Loader } from '@/components/Loader/Loader';
const getHasJoinedKey = (gameId) => `hasJoined-${gameId}`;
export default function GameApp({ gameId }) {
  const [joinFormData, setJoinFormData] = useState(null);
  const [hasJoinedThisGame, setHasJoinedThisGame] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(getHasJoinedKey(gameId)) === 'true';
  });
  const [isCreatingGame, setIsCreatingGame] = useState(null);
  const {
    currentUserId,
    currentUserName,
    users,
    votes,
    revealed,
    selectedVote,
    setGameId,
    setSelectedVote,
    setCardSet,
  } = useGameStore();
  // displayName is undefined until the user submits the join form.
  // On page reload (returning user), the socket connects with undefined displayName
  // and the server resolves the name from its stored profile. See JOIN-GAME RULES in socket.js.
  const socket = useSocket(
    gameId,
    joinFormData?.displayName,
    true,
    joinFormData?.cardSet
  );
  const { copied, handleCopyLink } = useCopyToClipboard();
  const { handleCardClick, handleReveal, handleReset } = useGameActions({
    socket,
    gameId,
    userId: currentUserId,
    selectedVote,
    setSelectedVote,
    revealed,
  });
  const confettiOrigin = useConfettiOrigin(votes, revealed);
  const { particles } = useConfetti(votes, revealed, confettiOrigin);
  const { getAnimationsForUser } = useEmojiAnimations(socket);
  useEffect(() => {
    setGameId(gameId);
    // Clear any card set carried over from a previously viewed game (SPA
    // navigation keeps the store alive). The authoritative set for this game
    // arrives via the socket's user-joined / card-set-updated events.
    setCardSet(null);
  }, [gameId, setGameId, setCardSet]);
  // Check if game exists on mount using HTTP API
  useEffect(() => {
    let cancelled = false;
    const checkGameExists = async () => {
      try {
        const response = await fetch(`/api/game/${gameId}`);
        if (!cancelled && response.ok) {
          const data = await response.json();
          setIsCreatingGame(!data.exists);
        }
      } catch {
        if (!cancelled) {
          setIsCreatingGame(true);
        }
      }
    };
    checkGameExists();
    return () => {
      cancelled = true;
    };
  }, [gameId]);
  useEffect(() => {
    // If the server tells us we don't have a name (e.g. server restarted or session lost)
    // and we don't have a locally typed name, but we thought we had joined,
    // reset the join state so the form appears
    if (
      hasJoinedThisGame &&
      currentUserId &&
      !currentUserName &&
      !joinFormData?.displayName
    ) {
      setTimeout(() => {
        setHasJoinedThisGame(false);
        localStorage.removeItem(getHasJoinedKey(gameId));
      }, 0);
    }
  }, [
    hasJoinedThisGame,
    currentUserId,
    currentUserName,
    gameId,
    joinFormData?.displayName,
  ]);
  const handleEditName = useCallback((newName) => {
    // Returning/refreshed users have no joinFormData (they never submitted the
    // form this session). Seed it so the rename still propagates to the server.
    setJoinFormData((prev) =>
      prev ? { ...prev, displayName: newName } : { displayName: newName }
    );
  }, []);
  if (!hasJoinedThisGame) {
    if (isCreatingGame === null) {
      return <Loader />;
    }
    return (
      <JoinGameForm
        gameId={gameId}
        onSubmit={(data) => {
          if (isCreatingGame && data.cardSet) {
            setCardSet(data.cardSet);
          }
          setJoinFormData(data);
          setHasJoinedThisGame(true);
          localStorage.setItem(getHasJoinedKey(gameId), 'true');
        }}
        initialName={currentUserName}
        isCreating={isCreatingGame}
      />
    );
  }
  if (!currentUserId) {
    return <Loader />;
  }
  const hasAnyVotes = users.some((u) => u.hasVoted);
  return (
    <div className={styles.gamePage}>
      <div className={styles.gameWrapper}>
        <GameHeader
          gameId={gameId}
          revealed={revealed}
          hasVotes={hasAnyVotes}
          copied={copied}
          socket={socket}
          onReveal={handleReveal}
          onReset={handleReset}
          onCopyLink={handleCopyLink}
        />

        <div className={styles.gameMainTable}>
          <PokerTable
            users={users}
            votes={votes}
            revealed={revealed}
            currentUserId={currentUserId}
            socket={socket}
            gameId={gameId}
            selectedVote={selectedVote}
            onVote={handleCardClick}
            onReveal={handleReveal}
            onReset={handleReset}
            onEditName={handleEditName}
            getAnimationsForUser={getAnimationsForUser}
          />
        </div>
      </div>

      <ConfettiContainer particles={particles} />
      {copied && <Toast message="Link copied to clipboard" />}
    </div>
  );
}
