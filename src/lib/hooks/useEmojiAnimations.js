import { useState, useEffect, useRef, useCallback } from 'react';
const ANIMATION_DURATION_MS = 1500;
function getRandomProjectileCount() {
  return Math.floor(Math.random() * 3) + 1;
}
function createAnimationFromAngle(baseId, index, emoji, targetUserId) {
  const incomingAngle = Math.random() * Math.PI * 2;
  const startDistance = 150 + Math.random() * 100;
  const impactDistance = 5 + Math.random() * 15;
  const startX = Math.cos(incomingAngle) * startDistance;
  const startY = Math.sin(incomingAngle) * startDistance;
  const impactX = Math.cos(incomingAngle) * impactDistance;
  const impactY = Math.sin(incomingAngle) * impactDistance;
  const bounceDistance = 40 + Math.random() * 30;
  const gravityDrop = 25 + Math.random() * 20;
  const deflection = (Math.random() - 0.5) * 30;
  let bounceX;
  let bounceY;
  if (Math.abs(startY) > Math.abs(startX)) {
    bounceX = impactX + deflection;
    bounceY = startY < 0 ? impactY - bounceDistance : impactY + bounceDistance;
  } else {
    bounceY = impactY + gravityDrop;
    bounceX = startX < 0 ? impactX - bounceDistance : impactX + bounceDistance;
  }
  return {
    id: baseId + index + Math.random(),
    emoji,
    targetUserId,
    delay: index * 0.1,
    startX,
    startY,
    impactX,
    impactY,
    bounceX,
    bounceY,
    rotation: Math.random() * 720 - 360,
  };
}
function createAnimations(targetUserId, emoji) {
  const baseId = Date.now();
  const animations = [];
  const projectileCount = getRandomProjectileCount();
  for (let i = 0; i < projectileCount; i++) {
    animations.push(createAnimationFromAngle(baseId, i, emoji, targetUserId));
  }
  return animations;
}
export function useEmojiAnimations(socket) {
  const [animations, setAnimations] = useState([]);
  const timeoutsRef = useRef(new Set());
  useEffect(() => {
    if (!socket) return;
    const timeouts = timeoutsRef.current;
    const handleEmojiThrown = ({ targetUserId, emoji }) => {
      const newAnimations = createAnimations(targetUserId, emoji);
      setAnimations((prev) => [...prev, ...newAnimations]);
      const timeoutId = setTimeout(() => {
        setAnimations((prev) =>
          prev.filter((a) => !newAnimations.find((n) => n.id === a.id))
        );
        timeouts.delete(timeoutId);
      }, ANIMATION_DURATION_MS);
      timeouts.add(timeoutId);
    };
    socket.on('emoji-thrown', handleEmojiThrown);
    return () => {
      socket.off('emoji-thrown', handleEmojiThrown);
      timeouts.forEach((id) => clearTimeout(id));
      timeouts.clear();
    };
  }, [socket]);
  const getAnimationsForUser = useCallback(
    (userId) => animations.filter((a) => a.targetUserId === userId),
    [animations]
  );
  return { animations, getAnimationsForUser };
}
