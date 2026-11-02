import styles from './UserCard.module.css';
import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { getVoteLabel, CARD_VALUES } from '@/lib/constants';
import { EmojiPicker } from '@/components/EmojiPicker/EmojiPicker';
import { EmojiProjectile } from '@/components/EmojiProjectile/EmojiProjectile';
function getCardClassName(hasVoted, revealed, vote, isDisconnected) {
  const classes = [styles.playerCard];
  if (hasVoted) classes.push(styles.playerCardVoted);
  if (revealed && vote) classes.push(styles.playerCardRevealed);
  if (isDisconnected) classes.push(styles.playerCardDisconnected);
  return classes.filter(Boolean).join(' ');
}
function getPlayerNameClassName(isDisconnected) {
  const classes = [styles.playerName];
  if (isDisconnected) classes.push(styles.playerNameDisconnected);
  return classes.filter(Boolean).join(' ');
}
export function UserCard({
  user,
  vote,
  revealed,
  isCurrentUser,
  isHovered,
  animations,
  onMouseEnter,
  onMouseLeave,
  onThrowEmoji,
  onEditName,
}) {
  const { hasVoted, connected: isConnected, displayName } = user;
  const { cardSet } = useGameStore();
  const cards = cardSet?.cards || CARD_VALUES;
  const isDisconnected = !isConnected;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(displayName);
  const cardClassName = getCardClassName(
    hasVoted,
    revealed,
    vote,
    isDisconnected
  );
  const renderCardContent = () => {
    if (isDisconnected) {
      return (
        <div className={styles.playerCardContent}>
          <span className={styles.playerCardEmoji}>🔌</span>
        </div>
      );
    }
    if (revealed && vote) {
      const isFibonacci = cardSet?.preset === 'fibonacci';
      const label = getVoteLabel(vote, cards);
      // Hide the size sublabel when it would duplicate the label already shown
      // as the "emoji" (e.g. numeric sets like Fibonacci where label === value).
      const showSize =
        vote !== 'unknown' &&
        vote !== '?' &&
        label.toUpperCase() !== vote.toUpperCase();
      return (
        <div className={styles.playerCardContent}>
          <span
            className={`${styles.playerCardEmoji} ${isFibonacci ? styles.playerCardEmojiText : ''}`}
          >
            {label}
          </span>
          {showSize && (
            <span className={styles.playerCardSize}>{vote.toUpperCase()}</span>
          )}
        </div>
      );
    }
    return <span className={styles.playerCardBack}></span>;
  };
  const playerNameClassName = getPlayerNameClassName(isDisconnected);
  return (
    <div
      className={styles.tablePlayer}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={cardClassName}>
        {renderCardContent()}

        {animations.map((anim) => (
          <EmojiProjectile key={anim.id} animation={anim} />
        ))}
      </div>

      {isHovered && !isCurrentUser && (
        <EmojiPicker onSelectEmoji={onThrowEmoji} />
      )}

      <span className={playerNameClassName}>
        {isEditing ? (
          <form
            className={styles.playerNameEditForm}
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = editValue.trim();
              if (trimmed && trimmed !== displayName) {
                onEditName?.(trimmed);
              }
              setIsEditing(false);
            }}
          >
            <input
              className={styles.playerNameEditInput}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => {
                const trimmed = editValue.trim();
                if (trimmed && trimmed !== displayName) {
                  onEditName?.(trimmed);
                }
                setIsEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditValue(displayName);
                  setIsEditing(false);
                }
              }}
              autoFocus
              aria-label="Edit your name"
            />
          </form>
        ) : isCurrentUser ? (
          <button
            className={styles.playerNameEditable}
            onClick={() => {
              setEditValue(displayName);
              setIsEditing(true);
            }}
            aria-label="Edit your name"
            title="Edit your name"
          >
            <span className={styles.playerNameText}>{displayName}</span>
            <span className={styles.playerYou}>(you)</span>
          </button>
        ) : (
          displayName
        )}
      </span>
    </div>
  );
}
