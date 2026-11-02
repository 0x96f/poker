import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMessage } from '../cloudflare/validation.js';
import {
  calculateAllCardStats,
  getVoteAnalysis,
} from '../src/lib/vote-utils.js';
import { getDuplicateValues } from '../src/lib/card-validation.js';
import { routeRequest } from '../cloudflare/router.js';

const message = (event, data) =>
  JSON.stringify({ event, data: { gameId: 'room', ...data } });

test('rejects malformed messages, invalid votes, duplicate cards and unknown events', () => {
  for (const raw of [
    '{',
    'null',
    message('unknown', {}),
    message('vote', { userId: 'u', vote: 5 }),
    message('join-game', { userId: 'u', username: ' ' }),
    message('update-card-set', {
      cardSet: {
        preset: 'custom',
        cards: [
          { value: '1', label: 'one', description: '' },
          { value: '1', label: 'two', description: '' },
        ],
      },
    }),
  ])
    assert.equal(parseMessage(raw), null);
  assert.equal(
    parseMessage(message('vote', { userId: 'u', vote: null })).event,
    'vote'
  );
  assert.equal(
    parseMessage(message('join-game', { userId: 'u' })).event,
    'join-game'
  );
});

test('statistics stay hidden until reveal and handle tied estimates', () => {
  const votes = [
    { userId: 'a', vote: '1' },
    { userId: 'b', vote: '2' },
  ];
  const cards = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
  ];
  assert.equal(calculateAllCardStats(votes, false, cards)['1'].voteCount, 0);
  const stats = calculateAllCardStats(votes, true, cards);
  assert.equal(stats['1'].percentage, 50);
  assert.equal(stats['2'].isMostCommon, true);
  assert.equal(getVoteAnalysis(votes).isUnanimous, false);
  assert.equal(getVoteAnalysis([{ vote: '1' }]).isUnanimous, false);
  assert.equal(
    getVoteAnalysis([{ vote: '1' }, { vote: '1' }]).isUnanimous,
    true
  );
});

test('custom card duplicate detection uses label fallback and ignores blank cards', () => {
  assert.deepEqual(
    [
      ...getDuplicateValues([
        { label: 'A', value: '' },
        { label: 'B', value: 'A' },
        { label: '', value: 'A' },
      ]),
    ],
    ['A']
  );
});

test('room URLs serve the static shell without redirecting', async () => {
  let path;
  const env = {
    ASSETS: {
      fetch: async (request) => {
        path = new URL(request.url).pathname;
        return new Response('shell');
      },
    },
  };
  for (const roomPath of ['/game/room', '/game/room/']) {
    const response = await routeRequest(
      new Request('https://poker.test' + roomPath),
      env
    );
    assert.equal(response.status, 200);
    assert.equal(path, '/game.html');
    assert.equal(response.headers.get('Location'), null);
  }
});

test('backend routing enforces IDs, method and WebSocket origin', async () => {
  const request = (path, options) =>
    routeRequest(new Request('https://poker.test' + path, options), {});
  assert.equal((await request('/api/game/bad!')).status, 400);
  assert.equal((await request('/ws/room')).status, 426);
  assert.equal(
    (await request('/api/game/room', { method: 'POST' })).status,
    405
  );
  assert.equal(
    (
      await request('/ws/room', {
        headers: { Upgrade: 'websocket', Origin: 'https://other.test' },
      })
    ).status,
    403
  );
  let room;
  const env = {
    ROOMS: {
      getByName: (id) => {
        room = id;
        return { fetch: async () => Response.json({ exists: false }) };
      },
    },
  };
  const response = await routeRequest(
    new Request('https://poker.test/api/game/new-room'),
    env
  );
  assert.equal(room, 'new-room');
  assert.equal((await response.json()).exists, false);
});
