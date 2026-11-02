import shared from '@/styles/primitives.module.css';
import styles from './JoinGameForm.module.css';
import { useState } from 'react';
import { CARD_PRESETS, DEFAULT_CARD_PRESET } from '@/lib/constants';
import { CardSetSelector } from '@/components/CardSetSelector/CardSetSelector';
export function JoinGameForm({
  gameId,
  onSubmit,
  initialName = '',
  isCreating = false,
}) {
  const [displayName, setDisplayName] = useState(initialName || '');
  const [cardSet, setCardSet] = useState({
    preset: DEFAULT_CARD_PRESET,
    cards: [...CARD_PRESETS[DEFAULT_CARD_PRESET].cards],
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName) return;
    onSubmit({
      displayName: trimmedName,
      ...(isCreating ? { cardSet } : {}),
    });
  };
  return (
    <div className={styles.joinPage}>
      <div className={`${shared.card} ${styles.joinCard}`}>
        <h1 className={styles.joinTitle}>
          {isCreating ? 'Create Game' : 'Join Game'}
        </h1>
        <p className={styles.joinSubtitle}>
          Game ID: <span className={styles.joinGameId}>{gameId}</span>
        </p>

        <form
          className={styles.joinForm}
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <div className={styles.joinFormGroup}>
            <label htmlFor="playerName" className={styles.joinLabel}>
              Your name
            </label>
            <input
              id="playerName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className={shared.input}
              autoFocus
              required
              name="playerName"
              autoComplete="nickname"
            />
          </div>
          {isCreating ? (
            <>
              <button
                type="submit"
                disabled={!displayName.trim()}
                className={`${shared.buttonPrimary} ${styles.joinButton}`}
              >
                Create Game
              </button>
              <div className={styles.joinDivider}>
                <span className={styles.joinDividerText}>Card Set</span>
              </div>
              <div
                className={[
                  styles.joinFormGroup,
                  styles.settingsOptionsContainer,
                ].join(' ')}
              >
                <CardSetSelector
                  initialCardSet={cardSet}
                  onCardSetChange={setCardSet}
                  hideHeader
                />
              </div>
            </>
          ) : (
            <button
              type="submit"
              disabled={!displayName.trim()}
              className={`${shared.buttonPrimary} ${styles.joinButton}`}
            >
              Join Game
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
