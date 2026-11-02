import shared from '@/styles/primitives.module.css';
import styles from './GameControls.module.css';
export function GameControls({ revealed, onReveal, onReset, hasVotes }) {
  return !revealed ? (
    <button
      onClick={onReveal}
      disabled={!hasVotes}
      className={`${shared.buttonSuccess} ${styles.revealButton}`}
    >
      Reveal Votes
    </button>
  ) : (
    <button
      onClick={onReset}
      className={`${shared.buttonSuccess} ${styles.resetButton}`}
    >
      Start New Round
    </button>
  );
}
