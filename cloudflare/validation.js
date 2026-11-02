function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function text(value, max) {
  return (
    typeof value === 'string' && value.trim().length > 0 && value.length <= max
  );
}
function cardSet(value) {
  return (
    record(value) &&
    ['tshirt', 'fibonacci', 'weeks', 'custom'].includes(String(value.preset)) &&
    Array.isArray(value.cards) &&
    value.cards.length > 0 &&
    value.cards.length <= 100 &&
    value.cards.every(
      (card) =>
        record(card) &&
        text(card.value, 100) &&
        text(card.label, 100) &&
        typeof card.description === 'string' &&
        card.description.length <= 500
    ) &&
    new Set(value.cards.map((card) => card.value)).size === value.cards.length
  );
}
export function parseMessage(raw) {
  let message;
  try {
    message = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!record(message) || !record(message.data)) return null;
  const data = message.data;
  if (!text(data.gameId, 64)) return null;
  switch (message.event) {
    case 'join-game':
      if (
        !text(data.userId, 128) ||
        (data.username !== undefined && !text(data.username, 100)) ||
        (data.cardSet !== undefined && !cardSet(data.cardSet))
      )
        return null;
      break;
    case 'vote':
      if (
        !text(data.userId, 128) ||
        (data.vote !== null && !text(data.vote, 100))
      )
        return null;
      break;
    case 'throw-emoji':
      if (!text(data.targetUserId, 128) || !text(data.emoji, 32)) return null;
      break;
    case 'update-card-set':
      if (!cardSet(data.cardSet)) return null;
      break;
    case 'reveal-votes':
    case 'reset-votes':
      break;
    default:
      return null;
  }
  return message;
}
