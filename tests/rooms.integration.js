import test from 'node:test';
import assert from 'node:assert/strict';

const base = process.env.TEST_URL || 'http://localhost:8787';
function connect(room, userId, username) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(base.replace(/^http/, 'ws') + '/ws/' + room);
    const messages = [];
    socket.addEventListener('error', reject, { once: true });
    socket.addEventListener('message', ({ data }) => {
      if (data === 'pong') return;
      const event = JSON.parse(data);
      messages.push(event);
    });
    socket.addEventListener(
      'open',
      () => {
        const client = {
          socket,
          messages,
          send(event, data = {}) {
            socket.send(
              JSON.stringify({ event, data: { gameId: room, ...data } })
            );
          },
          async wait(event, predicate = () => true) {
            const deadline = Date.now() + 5000;
            while (Date.now() < deadline) {
              const index = messages.findIndex(
                (m) => m.event === event && predicate(m.data)
              );
              if (index >= 0) return messages.splice(index, 1)[0].data;
              await new Promise((r) => setTimeout(r, 20));
            }
            throw new Error(
              'Timed out waiting for ' + event + ': ' + JSON.stringify(messages)
            );
          },
        };
        client.send('join-game', { userId, ...(username ? { username } : {}) });
        resolve(client);
      },
      { once: true }
    );
  });
}

test('built Worker serves room links and true 404s', async () => {
  for (const path of ['/', '/game/direct-room', '/game/direct-room/']) {
    const response = await fetch(base + path, { redirect: 'manual' });
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), /Planning Poker/);
  }
  assert.equal((await fetch(base + '/missing-page')).status, 404);
  assert.equal((await fetch(base + '/game/invalid!')).status, 404);
  assert.equal((await fetch(base + '/api/game/invalid!')).status, 400);
});

test('players vote privately, reconnect, reveal, edit cards and reset', async (t) => {
  const room = 'test-' + crypto.randomUUID();
  const clients = [];
  t.after(() => clients.forEach((c) => c.socket.close()));
  const open = async (id, name) => {
    const c = await connect(room, id, name);
    clients.push(c);
    return c;
  };
  assert.equal(
    (await (await fetch(base + '/api/game/' + room)).json()).exists,
    false
  );
  const alice = await open('alice', 'Alice');
  await alice.wait('user-joined');
  const bob = await open('bob', 'Bob');
  await bob.wait('user-joined');
  alice.send('vote', { userId: 'alice', vote: '3' });
  await alice.wait('user-joined', (d) => d.votes.some((v) => v.vote === '3'));
  const duplicate = await open('alice');
  const restored = await duplicate.wait('user-joined');
  assert.equal(restored.username, 'Alice');
  assert.deepEqual(restored.votes, [{ userId: 'alice', vote: '3' }]);
  const bobTab = await open('bob');
  assert.deepEqual((await bobTab.wait('user-joined')).votes, []);
  bob.send('vote', { userId: 'bob', vote: '3' });
  await bob.wait('user-joined', (d) => d.votes.length === 1);
  alice.send('reveal-votes');
  assert.equal((await bob.wait('votes-revealed')).votes.length, 2);
  alice.send('reset-votes');
  await bob.wait('votes-reset');
  alice.send('vote', { userId: 'alice', vote: '3' });
  await alice.wait('user-joined', (d) => d.votes.some((v) => v.vote === '3'));
  alice.send('update-card-set', {
    cardSet: {
      preset: 'custom',
      cards: [{ value: 'A', label: 'A', description: '' }],
    },
  });
  const updated = await alice.wait('card-set-updated');
  assert.deepEqual(updated.invalidatedUserIds, ['alice']);
  alice.send('throw-emoji', { targetUserId: 'bob', emoji: '🥊' });
  assert.equal((await bob.wait('emoji-thrown')).targetUserId, 'bob');
  alice.send('join-game', { userId: 'alice', username: 'Alice renamed' });
  assert.equal(
    (await duplicate.wait('user-joined', (d) => d.username === 'Alice renamed'))
      .username,
    'Alice renamed'
  );
  assert.equal(
    (await (await fetch(base + '/api/game/' + room)).json()).exists,
    true
  );
});
