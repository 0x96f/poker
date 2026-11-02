import { useState, useEffect, useRef, useMemo } from 'react';
import { hasUnanimousVote } from '@/lib/vote-utils';
const CONFETTI_COUNT = 150;
const CONFETTI_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#a855f7', // purple
  '#14b8a6', // teal
];
const CONFETTI_EMOJIS = ['🥳', '🎉', '🎈', '🎊'];
function createConfettiParticles(origin) {
  const particles = [];
  const baseId = Date.now();
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const isEmoji = Math.random() < 0.4;
    const angle = (Math.random() * 360 * Math.PI) / 180;
    const velocity = 40 + Math.random() * 120;
    const startOffset = Math.random() * 5;
    const particle = {
      id: baseId + i,
      color:
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      x: origin.x + Math.cos(angle) * startOffset,
      y: origin.y + Math.sin(angle) * startOffset,
      delay: Math.random() * 0.3,
      rotation: Math.random() * 360,
      scale: 0.3 + Math.random() * 0.9,
      velocityX: Math.cos(angle) * velocity,
      velocityY: Math.sin(angle) * velocity,
      fadeInPoint: 1 + Math.random() * 10,
    };
    if (isEmoji) {
      particle.emoji =
        CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)];
    }
    particles.push(particle);
  }
  return particles;
}
export function useConfetti(votes, revealed, origin) {
  const [triggerId, setTriggerId] = useState(0);
  const prevRevealedRef = useRef(revealed);
  const counterRef = useRef(0);
  const isUnanimous = useMemo(() => hasUnanimousVote(votes), [votes]);
  useEffect(() => {
    const wasRevealed = prevRevealedRef.current;
    prevRevealedRef.current = revealed;
    if (!wasRevealed && revealed && isUnanimous) {
      counterRef.current += 1;
      setTriggerId(counterRef.current);
    } else if (!revealed && triggerId !== 0) {
      setTriggerId(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, isUnanimous]);
  const particles = useMemo(() => {
    if (triggerId === 0) return [];
    return createConfettiParticles(origin);
  }, [triggerId, origin]);
  return {
    particles,
    isActive: particles.length > 0,
  };
}
