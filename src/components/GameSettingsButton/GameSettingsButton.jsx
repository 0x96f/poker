import styles from './GameSettingsButton.module.css';
import { useState } from 'react';
import { CARD_PRESETS, DEFAULT_CARD_PRESET } from '@/lib/constants';
import { CardSetSelector } from '@/components/CardSetSelector/CardSetSelector';
import { GearIcon } from '@/components/icons';
import { useGameStore } from '@/lib/store';
export function GameSettingsButton({ socket, gameId }) {
  const [showDialog, setShowDialog] = useState(false);
  const { cardSet: currentCardSet } = useGameStore();
  const [cardSet, setCardSet] = useState({
    preset: DEFAULT_CARD_PRESET,
    cards: [...CARD_PRESETS[DEFAULT_CARD_PRESET].cards],
  });
  const handleUpdateSettings = () => {
    if (!socket || !gameId) return;
    socket.emit('update-card-set', {
      gameId,
      cardSet,
    });
    setShowDialog(false);
  };
  const handleOpenDialog = () => {
    // Load current game's card set
    if (currentCardSet) {
      setCardSet(currentCardSet);
    }
    setShowDialog(true);
  };
  return (
    <>
      <button
        onClick={handleOpenDialog}
        className={styles.gameSettingsButton}
        aria-label="Game settings"
        title="Change card set"
      >
        <GearIcon />
      </button>

      {showDialog && (
        <div
          className={styles.gameSettingsDialogOverlay}
          onClick={() => setShowDialog(false)}
        >
          <div
            className={styles.gameSettingsDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.gameSettingsDialogHeader}>
              <h2 className={styles.gameSettingsDialogTitle}>Settings</h2>
              <button
                className={styles.gameSettingsDialogClose}
                onClick={() => setShowDialog(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className={styles.gameSettingsDialogContent}>
              <CardSetSelector
                initialCardSet={cardSet}
                onCardSetChange={setCardSet}
                hideHeader
              />
            </div>

            <div className={styles.gameSettingsDialogFooter}>
              <button
                onClick={() => setShowDialog(false)}
                className={styles.gameSettingsDialogCancel}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSettings}
                className={styles.gameSettingsDialogSubmit}
              >
                Update Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
