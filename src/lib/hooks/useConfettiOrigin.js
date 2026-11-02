import { useMemo } from 'react';
import { getVoteAnalysis } from '@/lib/vote-utils';
export function useConfettiOrigin(votes, revealed) {
  return useMemo(() => {
    if (!revealed || votes.length === 0) return { x: 50, y: 50 };
    const { isUnanimous, unanimousVote } = getVoteAnalysis(votes);
    if (isUnanimous && unanimousVote) {
      const cardElement = document.querySelector(
        `[data-card-size="${unanimousVote}"]`
      );
      if (cardElement) {
        const rect = cardElement.getBoundingClientRect();
        const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
        const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
        return { x, y };
      }
    }
    return { x: 50, y: 50 };
  }, [revealed, votes]);
}
