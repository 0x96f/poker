import shared from '@/styles/primitives.module.css';
import styles from './CreateGameButton.module.css';
import { generateGameId } from '@/lib/game-utils';
export function CreateGameButton({ className }) {
  const handleCreateGame = () => {
    const newGameId = generateGameId();
    window.location.assign(`/game/${newGameId}`);
  };
  return (
    <button
      onClick={handleCreateGame}
      className={[shared.buttonPrimary, styles.createGameButton, className]
        .filter(Boolean)
        .join(' ')}
    >
      Create New Game
    </button>
  );
}
