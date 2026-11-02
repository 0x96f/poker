// Legacy VoteSize for backward compatibility
export const VoteSize = {
  XS: 'xs',
  S: 's',
  M: 'm',
  L: 'l',
  XL: 'xl',
  UNKNOWN: 'unknown',
};
// T-shirt sizing preset
export const TSHIRT_CARDS = [
  { value: 'xs', label: '🐜', description: 'Extra Small (< 1 day)' },
  { value: 's', label: '🐰', description: 'Small (1 - 2 days)' },
  { value: 'm', label: '🐶', description: 'Medium (1 week)' },
  { value: 'l', label: '🦒', description: 'Large (2 weeks)' },
  { value: 'xl', label: '🦕', description: 'Extra Large (2+ weeks)' },
  { value: '?', label: '☕', description: 'Unknown' },
];
// Fibonacci sequence preset
export const FIBONACCI_CARDS = [
  { value: '1', label: '1', description: '1 point' },
  { value: '2', label: '2', description: '2 points' },
  { value: '3', label: '3', description: '3 points' },
  { value: '5', label: '5', description: '5 points' },
  { value: '8', label: '8', description: '8 points' },
  { value: '13', label: '13', description: '13 points' },
  { value: '?', label: '☕', description: 'Unknown' },
];
// Week-based preset
export const WEEKS_CARDS = [
  { value: '1w', label: '1️⃣', description: '1 week' },
  { value: '2w', label: '2️⃣', description: '2 weeks' },
  { value: '3w', label: '3️⃣', description: '3 weeks' },
  { value: '4w', label: '4️⃣', description: '4 weeks' },
  { value: '5w', label: '5️⃣', description: '4 weeks' },
  { value: '6w', label: '6️⃣', description: '6 weeks' },
  { value: '?', label: '☕', description: 'Unknown' },
];
export const DEFAULT_CARD_PRESET = 'fibonacci';
// Fallback deck when a game has no card set yet.
export const CARD_VALUES = FIBONACCI_CARDS;
// Card presets configuration
export const CARD_PRESETS = {
  tshirt: {
    name: 'T-Shirts',
    cards: TSHIRT_CARDS,
  },
  fibonacci: {
    name: 'Fibonacci',
    cards: FIBONACCI_CARDS,
  },
  weeks: {
    name: 'Weeks',
    cards: WEEKS_CARDS,
  },
  custom: {
    name: 'Custom',
    cards: [],
  },
};
export const SINGLE_KEY_VOTES = [VoteSize.S, VoteSize.M, VoteSize.L];
export const THROW_EMOJIS = ['🥊', '🪃', '🪨', '✈️'];
export function getVoteLabel(voteValue, cards = CARD_VALUES) {
  const card = cards.find((c) => c.value === voteValue);
  return card ? card.label : voteValue;
}
