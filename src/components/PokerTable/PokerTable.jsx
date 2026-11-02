import styles from './PokerTable.module.css';
import { useState, useCallback } from 'react';
import { emitThrowEmoji } from '@/lib/socket';
import { getVoteForUser } from '@/lib/vote-utils';
import { VotingCards } from '@/components/VotingCards/VotingCards';
import { UserCard } from '@/components/UserCard/UserCard';
import { RefreshIcon } from '@/components/icons';
export function PokerTable({
  users,
  votes,
  revealed,
  currentUserId,
  socket,
  gameId,
  selectedVote,
  onVote,
  onReveal,
  onReset,
  onEditName,
  getAnimationsForUser,
}) {
  const [hoveredUserId, setHoveredUserId] = useState(null);
  const handleThrowEmoji = useCallback(
    (targetUserId, emoji) => {
      emitThrowEmoji(socket, gameId, targetUserId, emoji);
    },
    [socket, gameId]
  );
  const renderUserCard = (user) => {
    const vote = getVoteForUser(votes, user.id);
    const isCurrentUser = user.id === currentUserId;
    const isHovered = hoveredUserId === user.id;
    const userAnimations = getAnimationsForUser(user.id);
    return (
      <UserCard
        key={user.id}
        user={user}
        vote={vote}
        revealed={revealed}
        isCurrentUser={isCurrentUser}
        isHovered={isHovered}
        animations={userAnimations}
        onMouseEnter={() => !isCurrentUser && setHoveredUserId(user.id)}
        onMouseLeave={() => setHoveredUserId(null)}
        onThrowEmoji={(emoji) => handleThrowEmoji(user.id, emoji)}
        onEditName={isCurrentUser ? onEditName : undefined}
      />
    );
  };
  const votedCount = users.filter((u) => u.hasVoted).length;
  const allVoted = votedCount === users.length && users.length > 0;
  const showRevealButton = !revealed && allVoted;
  const getTableMessage = () => {
    if (revealed) return 'Votes revealed!';
    if (votedCount === 0) return 'Pick your cards!';
    return `${votedCount} of ${users.length} voted`;
  };
  return (
    <div className={styles.pokerTableContainer}>
      <div className={styles.tablePlayers}>{users.map(renderUserCard)}</div>

      <div className={styles.tableMessageContainer}>
        <span className={styles.tableMessage}>
          {showRevealButton ? 'All voted! Ready to reveal' : getTableMessage()}
        </span>
        {showRevealButton && (
          <button
            className={styles.tableMessageRevealButton}
            onClick={onReveal}
            title="Reveal votes"
            aria-label="Reveal votes"
          >
            <RefreshIcon />
          </button>
        )}
        {revealed && (
          <button
            className={styles.tableMessageRevealButton}
            onClick={onReset}
            title="Start new round"
            aria-label="Start new round"
          >
            <RefreshIcon />
          </button>
        )}
      </div>

      <VotingCards
        votes={votes}
        revealed={revealed}
        selectedVote={selectedVote}
        onVote={onVote}
      />
    </div>
  );
}
