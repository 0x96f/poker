import styles from './EmojiProjectile.module.css';
export function EmojiProjectile({ animation }) {
  return (
    <span
      className={styles.emojiProjectile}
      style={{
        animationDelay: `${animation.delay}s`,
        '--start-x': `${animation.startX}px`,
        '--start-y': `${animation.startY}px`,
        '--impact-x': `${animation.impactX}px`,
        '--impact-y': `${animation.impactY}px`,
        '--bounce-x': `${animation.bounceX}px`,
        '--bounce-y': `${animation.bounceY}px`,
        '--rotation': `${animation.rotation}deg`,
      }}
    >
      {animation.emoji}
    </span>
  );
}
