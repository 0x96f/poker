import { DurableObject } from 'cloudflare:workers';
import { CARD_PRESETS, DEFAULT_CARD_PRESET } from '../src/lib/constants.js';
import { parseMessage } from './validation.js';
const ROOM_TTL_MS = 60 * 60 * 1000;
const DISCONNECT_GRACE_MS = 2000;
function emptyRoom() {
  return {
    users: [],
    votes: new Map(),
    revealed: false,
    nextJoinOrder: 0,
    lastActivityAt: Date.now(),
    disconnects: new Map(),
  };
}
export class GameRoom extends DurableObject {
  room = emptyRoom();
  constructor(ctx, env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair('ping', 'pong')
    );
    ctx.blockConcurrencyWhile(async () => {
      this.room = (await ctx.storage.get('room')) ?? emptyRoom();
      // Hibernation keeps sockets alive; a deployment or runtime restart may not.
      const active = this.activeUsers();
      for (const user of this.room.users) {
        if (
          user.connected &&
          !active.has(user.id) &&
          !this.room.disconnects.has(user.id)
        ) {
          this.room.disconnects.set(user.id, Date.now() + DISCONNECT_GRACE_MS);
        }
      }
      if (this.room.users.length) await this.persist();
    });
  }
  session(ws) {
    return ws.deserializeAttachment();
  }
  activeUsers() {
    return new Set(
      this.ctx.getWebSockets().flatMap((ws) => {
        const session = this.session(ws);
        return session?.userId ? [session.userId] : [];
      })
    );
  }
  sortedUsers() {
    return [...this.room.users].sort((a, b) => a.joinOrder - b.joinOrder);
  }
  allVotes() {
    return [...this.room.votes].map(([userId, vote]) => ({ userId, vote }));
  }
  send(ws, event, data) {
    try {
      ws.send(JSON.stringify({ event, data }));
    } catch {
      // The runtime delivers a close/error event for failed connections.
    }
  }
  broadcast(event, data, except) {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== except && this.session(ws)?.userId) this.send(ws, event, data);
    }
  }
  async persist() {
    await this.ctx.storage.put('room', this.room);
    const deadlines = [...this.room.disconnects.values()];
    if (!this.activeUsers().size && this.room.users.length) {
      deadlines.push(this.room.lastActivityAt + ROOM_TTL_MS);
    }
    if (deadlines.length) {
      await this.ctx.storage.setAlarm(
        Math.max(Date.now() + 1, Math.min(...deadlines))
      );
    } else {
      await this.ctx.storage.deleteAlarm();
    }
  }
  resetVotes() {
    this.room.votes.clear();
    this.room.revealed = false;
    for (const user of this.room.users) user.hasVoted = false;
  }
  async expireIfInactive() {
    if (
      this.room.users.length &&
      !this.activeUsers().size &&
      Date.now() - this.room.lastActivityAt >= ROOM_TTL_MS
    ) {
      await this.ctx.storage.deleteAll();
      this.room = emptyRoom();
    }
  }
  async fetch(request) {
    await this.expireIfInactive();
    if (new URL(request.url).pathname.startsWith('/api/game/')) {
      return Response.json(
        { exists: this.room.users.length > 0, cardSet: this.room.cardSet },
        {
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }
    const gameId = new URL(request.url).pathname.split('/').pop();
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ gameId });
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
  async webSocketMessage(ws, raw) {
    if (typeof raw !== 'string' || raw.length > 32768) {
      ws.close(1009, 'Message too large or unsupported');
      return;
    }
    const message = parseMessage(raw);
    if (!message) {
      this.send(ws, 'error', { message: 'Invalid message' });
      return;
    }
    const session = this.session(ws);
    if (message.data.gameId !== session.gameId) return;
    if (message.event === 'join-game') {
      const { userId, username, cardSet } = message.data;
      // A connection cannot switch identities after joining.
      if (session.userId && session.userId !== userId) return;
      const existing = this.room.users.find((user) => user.id === userId);
      const name = username?.trim() || existing?.displayName;
      if (!name) {
        this.send(ws, 'user-joined', {
          userId,
          username: null,
          users: [],
          votes: [],
          revealed: false,
        });
        return;
      }
      session.userId = userId;
      ws.serializeAttachment(session);
      this.room.disconnects.delete(userId);
      if (existing) {
        existing.displayName = name;
        existing.connected = true;
      } else {
        this.room.users.push({
          id: userId,
          displayName: name,
          connected: true,
          hasVoted: false,
          joinOrder: this.room.nextJoinOrder++,
        });
      }
      this.room.cardSet ??= cardSet ?? {
        preset: DEFAULT_CARD_PRESET,
        cards: [...CARD_PRESETS[DEFAULT_CARD_PRESET].cards],
      };
      this.room.lastActivityAt = Date.now();
      await this.persist();
      // Sync every tab of this user, without exposing hidden votes to others.
      for (const client of this.ctx.getWebSockets()) {
        if (this.session(client)?.userId === userId) {
          this.send(client, 'user-joined', {
            userId,
            username: name,
            users: this.sortedUsers(),
            votes: this.room.revealed
              ? this.allVotes()
              : this.allVotes().filter((vote) => vote.userId === userId),
            revealed: this.room.revealed,
            cardSet: this.room.cardSet,
          });
        }
      }
      this.broadcast('user-list-updated', { users: this.sortedUsers() });
      return;
    }
    const user = this.room.users.find((user) => user.id === session.userId);
    if (!user) return;
    this.room.lastActivityAt = Date.now();
    switch (message.event) {
      case 'vote': {
        const { userId, vote } = message.data;
        if (userId !== session.userId || this.room.revealed) return;
        if (
          vote !== null &&
          !this.room.cardSet?.cards.some((card) => card.value === vote)
        )
          return;
        if (vote === null) this.room.votes.delete(user.id);
        else this.room.votes.set(user.id, vote);
        user.hasVoted = vote !== null;
        await this.persist();
        this.broadcast('user-list-updated', { users: this.sortedUsers() });
        // Keep another tab of the same player in sync with the selection.
        for (const client of this.ctx.getWebSockets()) {
          if (this.session(client)?.userId === user.id) {
            this.send(client, 'user-joined', {
              userId: user.id,
              username: user.displayName,
              users: this.sortedUsers(),
              votes: this.allVotes().filter(
                (entry) => entry.userId === user.id
              ),
              revealed: false,
              cardSet: this.room.cardSet,
            });
          }
        }
        break;
      }
      case 'reveal-votes':
        this.room.revealed = true;
        await this.persist();
        this.broadcast('votes-revealed', {
          votes: this.allVotes(),
          revealed: true,
        });
        break;
      case 'reset-votes':
        this.resetVotes();
        await this.persist();
        this.broadcast('votes-reset', { users: this.sortedUsers() });
        break;
      case 'throw-emoji':
        if (
          this.room.users.some(
            (target) => target.id === message.data.targetUserId
          )
        ) {
          this.broadcast('emoji-thrown', {
            targetUserId: message.data.targetUserId,
            emoji: message.data.emoji,
          });
        }
        break;
      case 'update-card-set': {
        const wasRevealed = this.room.revealed;
        this.room.cardSet = message.data.cardSet;
        const invalidatedUserIds = [];
        if (wasRevealed) this.resetVotes();
        else {
          const valid = new Set(
            this.room.cardSet.cards.map((card) => card.value)
          );
          for (const [id, vote] of this.room.votes) {
            if (!valid.has(vote)) {
              this.room.votes.delete(id);
              const voter = this.room.users.find((entry) => entry.id === id);
              if (voter) voter.hasVoted = false;
              invalidatedUserIds.push(id);
            }
          }
        }
        await this.persist();
        this.broadcast('card-set-updated', {
          cardSet: this.room.cardSet,
          invalidatedUserIds,
        });
        this.broadcast(wasRevealed ? 'votes-reset' : 'user-list-updated', {
          users: this.sortedUsers(),
        });
        break;
      }
    }
  }
  async disconnected(ws) {
    const session = this.session(ws);
    ws.serializeAttachment({ gameId: session.gameId });
    if (session.userId && !this.activeUsers().has(session.userId)) {
      this.room.disconnects.set(
        session.userId,
        Date.now() + DISCONNECT_GRACE_MS
      );
      this.room.lastActivityAt = Date.now();
      await this.persist();
    }
  }
  async webSocketClose(ws) {
    await this.disconnected(ws);
  }
  async webSocketError(ws) {
    await this.disconnected(ws);
    ws.close(1011, 'Connection error');
  }
  async alarm() {
    const active = this.activeUsers();
    for (const [id, deadline] of this.room.disconnects) {
      if (deadline <= Date.now()) {
        const user = this.room.users.find((entry) => entry.id === id);
        if (user && !active.has(id)) user.connected = false;
        this.room.disconnects.delete(id);
      }
    }
    await this.expireIfInactive();
    if (this.room.users.length) await this.persist();
    this.broadcast('user-list-updated', { users: this.sortedUsers() });
  }
}
