import styles from './Toast.module.css';
import { CheckIcon } from '@/components/icons';
export function Toast({ message }) {
  return (
    <div className={styles.toast}>
      <CheckIcon />
      {message}
    </div>
  );
}
