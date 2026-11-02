import styles from './ConfettiContainer.module.css';
function getParticleStyle(particle) {
  const fadeIn = particle.fadeInPoint;
  return {
    left: `${particle.x}%`,
    top: `${particle.y}%`,
    backgroundColor: particle.emoji ? 'transparent' : particle.color,
    animationDelay: `${particle.delay}s`,
    '--rotation': `${particle.rotation}deg`,
    '--scale': particle.scale,
    '--velocity-x': `${particle.velocityX}vw`,
    '--velocity-y': `${particle.velocityY}vh`,
    '--opacity-5': fadeIn <= 5 ? 1 : 0,
    '--opacity-10': fadeIn <= 10 ? 1 : 0,
    '--opacity-20': fadeIn <= 20 ? 1 : 0,
    '--opacity-30': fadeIn <= 30 ? 1 : 0,
    '--opacity-40': fadeIn <= 40 ? 1 : 0,
    '--opacity-50': fadeIn <= 50 ? 1 : 0,
  };
}
export function ConfettiContainer({ particles }) {
  if (particles.length === 0) return null;
  return (
    <div className={styles.confettiContainer}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={
            particle.emoji ? styles.confettiEmoji : styles.confettiParticle
          }
          style={getParticleStyle(particle)}
        >
          {particle.emoji}
        </div>
      ))}
    </div>
  );
}
