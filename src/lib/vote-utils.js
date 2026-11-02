import { CARD_VALUES } from './constants.js';
export function getVoteForUser(votes, userId) {
  return votes.find((v) => v.userId === userId)?.vote;
}
export function hasUnanimousVote(votes) {
  return getVoteAnalysis(votes).isUnanimous;
}
export function getVoteAnalysis(votes) {
  if (votes.length < 2) {
    return {
      isUnanimous: false,
      unanimousVote: null,
      totalVotes: votes.length,
    };
  }
  const firstVote = votes[0].vote;
  const isUnanimous = votes.every((v) => v.vote === firstVote);
  return {
    isUnanimous,
    unanimousVote: isUnanimous ? firstVote : null,
    totalVotes: votes.length,
  };
}
export function calculateAllCardStats(votes, revealed, cards = CARD_VALUES) {
  if (!revealed) {
    const emptyStats = {
      voteCount: 0,
      percentage: 0,
      isMostCommon: false,
      hasVotes: false,
    };
    return Object.fromEntries(
      cards.map((c) => [c.value || c.label, emptyStats])
    );
  }
  const voteCounts = new Map();
  for (const vote of votes) {
    voteCounts.set(vote.vote, (voteCounts.get(vote.vote) || 0) + 1);
  }
  const maxVotes = Math.max(0, ...voteCounts.values());
  return Object.fromEntries(
    cards.map((card) => {
      // Use label as vote value if card.value is empty
      const voteValue = card.value || card.label;
      const voteCount = voteCounts.get(voteValue) || 0;
      const percentage =
        votes.length > 0 ? Math.round((voteCount / votes.length) * 100) : 0;
      const isMostCommon = voteCount > 0 && voteCount === maxVotes;
      return [
        voteValue,
        { voteCount, percentage, isMostCommon, hasVotes: voteCount > 0 },
      ];
    })
  );
}
