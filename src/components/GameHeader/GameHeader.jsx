import styles from './GameHeader.module.css';
import { GameControls } from '@/components/GameControls/GameControls';
import { CreateGameButton } from '@/components/CreateGameButton/CreateGameButton';
import { GameSettingsButton } from '@/components/GameSettingsButton/GameSettingsButton';
import { CopyIcon, CheckIcon } from '@/components/icons';
export function GameHeader({
  gameId,
  revealed,
  hasVotes,
  copied,
  socket,
  onReveal,
  onReset,
  onCopyLink,
}) {
  return (
    <header className={styles.gameHeader}>
      <div className={styles.gameHeaderLeft}>
        <CreateGameButton />
        <GameSettingsButton socket={socket} gameId={gameId} />
      </div>
      <h1 className={styles.gameHeaderTitle}>
        <a href="/" className={styles.gameHeaderTitleLink}>
          Planning Poker
        </a>
      </h1>
      <div className={styles.gameHeaderRight}>
        <GameControls
          revealed={revealed}
          onReveal={onReveal}
          onReset={onReset}
          hasVotes={hasVotes}
        />
        <button onClick={onCopyLink} className={styles.gameIdBadge}>
          <span className={styles.gameIdLabel}>Game:</span>
          <span className={styles.gameIdValue}>{gameId}</span>
          {copied ? (
            <CheckIcon className={styles.gameIdIcon} />
          ) : (
            <CopyIcon className={styles.gameIdIcon} />
          )}
        </button>
      </div>
    </header>
  );
}
