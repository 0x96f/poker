import styles from './VotingCards.module.css';
import { useMemo } from 'react';
import { useGameStore } from '@/lib/store';
import { CARD_VALUES } from '@/lib/constants';
import { calculateAllCardStats, hasUnanimousVote } from '@/lib/vote-utils';
function getVotingCardClassName(
  cardValue,
  selectedVote,
  revealed,
  stats,
  isUnanimous = false
) {
  const classes = [styles.votingCardSmall];
  if (!revealed && selectedVote === cardValue) {
    classes.push(styles.selected);
  }
  if (revealed && stats.isMostCommon) {
    classes.push(styles.mostCommon);
  }
  if (revealed && stats.hasVotes && !stats.isMostCommon) {
    classes.push(styles.hasVotes);
  }
  if (revealed && !stats.hasVotes) {
    classes.push(styles.noVotes);
  }
  if (revealed && isUnanimous && stats.percentage === 100) {
    classes.push(styles.unanimous);
  }
  return classes.join(' ');
}
export function VotingCards({ votes, revealed, selectedVote, onVote }) {
  const { cardSet } = useGameStore();
  const cards = cardSet?.cards || CARD_VALUES;
  const allCardStats = useMemo(
    () => calculateAllCardStats(votes, revealed, cards),
    [votes, revealed, cards]
  );
  const isUnanimous = useMemo(
    () => revealed && hasUnanimousVote(votes),
    [revealed, votes]
  );
  return (
    <div className={styles.votingSectionBottom}>
      <p className={styles.votingHint}>Click a card to vote</p>
      <div
        className={`${styles.votingCardsBottom} ${cardSet?.preset === 'fibonacci' ? styles.presetFibonacci : ''}`}
      >
        {cards.map((card, index) => {
          // Use label as vote value if card.value is empty
          const voteValue = card.value || card.label;
          const stats = allCardStats[voteValue] || {
            voteCount: 0,
            percentage: 0,
            isMostCommon: false,
            hasVotes: false,
          };
          const className = getVotingCardClassName(
            voteValue,
            selectedVote,
            revealed,
            stats,
            isUnanimous
          );
          const opacity = Math.min(stats.percentage, 99) / 100;
          const style =
            revealed && stats.hasVotes
              ? { '--vote-opacity': opacity }
              : undefined;
          const showPercentage = revealed && stats.hasVotes;
          // Hide the title sublabel when it would duplicate the label already
          // shown as the "emoji" (e.g. numeric sets like Fibonacci where
          // label === value).
          const showTitle =
            !showPercentage &&
            card.value !== 'unknown' &&
            card.value !== '?' &&
            card.label.toUpperCase() !== card.value.toUpperCase();
          return (
            <button
              key={`${card.value}-${card.label}-${index}`}
              className={className}
              onClick={() => onVote(voteValue)}
              title={card.description}
              style={style}
              data-card-value={voteValue}
              data-card-size={voteValue}
            >
              <span className={styles.votingCardEmoji}>{card.label}</span>
              {showPercentage && (
                <span className={styles.votingCardPercentage}>
                  {stats.percentage}%
                </span>
              )}
              {showTitle && (
                <span className={styles.votingCardTitle}>
                  {card.value.toUpperCase()}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
