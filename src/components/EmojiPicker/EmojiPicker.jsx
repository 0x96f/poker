import styles from './EmojiPicker.module.css';
import { THROW_EMOJIS } from '@/lib/constants';
export function EmojiPicker({ onSelectEmoji }) {
  return (
    <div className={styles.emojiPicker}>
      {THROW_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          className={styles.emojiPickerButton}
          onClick={() => onSelectEmoji(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
