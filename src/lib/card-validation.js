export const MAX_LABEL_LENGTH = 10;
export const MAX_VALUE_LENGTH = 10;
export function isTextLabel(label) {
  return /^[a-zA-Z0-9]+$/.test(label);
}
export function getValidCards(cards) {
  return cards.filter((card) => card.label.trim() !== '');
}
export function getVoteValue(card) {
  return card.value || card.label;
}
export function getDuplicateValues(cards) {
  const values = new Map();
  const duplicates = new Set();
  cards.forEach((card) => {
    if (!card.label.trim()) return;
    const value = getVoteValue(card);
    if (!value) return;
    const count = values.get(value) || 0;
    values.set(value, count + 1);
    if (count > 0) duplicates.add(value);
  });
  return duplicates;
}
