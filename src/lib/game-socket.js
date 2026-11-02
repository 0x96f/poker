// Event names stay the same as the game protocol; transport is native WebSocket.
export class GameSocket {
  gameId;
  ws = null;
  stopped = false;
  retry = 0;
  retryTimer;
  connectionTimer;
  pongTimer;
  heartbeatTimer;
  listeners = new Map();
  constructor(gameId) {
    this.gameId = gameId;
  }
  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  on(event, listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(listener);
  }
  off(event, listener) {
    this.listeners.get(event)?.delete(listener);
  }
  dispatch(event, data) {
    this.listeners.get(event)?.forEach((listener) => listener(data));
  }
  emit(event, data) {
    // Never buffer stale votes or commands across a reconnection.
    if (this.connected) this.ws.send(JSON.stringify({ event, data }));
  }
  ping = () => {
    if (!this.connected || document.visibilityState === 'hidden') return;
    // Keep the current deadline so repeated visibility/online events cannot
    // keep a dead connection alive indefinitely.
    if (this.pongTimer) return;
    const ws = this.ws;
    ws.send('ping');
    this.pongTimer = setTimeout(() => {
      this.pongTimer = undefined;
      if (document.visibilityState !== 'hidden')
        ws.close(4000, 'Heartbeat timed out');
    }, 15000);
  };
  resume = () => {
    if (document.visibilityState === 'hidden' || this.stopped) return;
    if (this.connected) this.ping();
    else if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      clearTimeout(this.retryTimer);
      this.open();
    }
  };
  connect() {
    document.addEventListener('visibilitychange', this.resume);
    window.addEventListener('online', this.resume);
    this.heartbeatTimer = setInterval(this.ping, 30000);
    this.open();
  }
  open() {
    if (this.stopped) return;
    const url = new URL(
      `/ws/${encodeURIComponent(this.gameId)}`,
      window.location.href
    );
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(url);
    this.ws = ws;
    this.connectionTimer = setTimeout(() => ws.close(), 20000);
    ws.onopen = () => {
      clearTimeout(this.connectionTimer);
      if (this.stopped) {
        ws.close();
        return;
      }
      this.retry = 0;
      this.dispatch('connect', undefined);
    };
    ws.onmessage = ({ data }) => {
      if (data === 'pong') {
        clearTimeout(this.pongTimer);
        this.pongTimer = undefined;
        return;
      }
      try {
        const message = JSON.parse(data);
        this.dispatch(message.event, message.data);
      } catch {
        this.dispatch('error', { message: 'Invalid server message' });
      }
    };
    ws.onclose = () => {
      clearTimeout(this.connectionTimer);
      clearTimeout(this.pongTimer);
      this.pongTimer = undefined;
      this.dispatch('disconnect', undefined);
      if (!this.stopped) {
        const delay = Math.min(1000 * 2 ** Math.min(this.retry++, 3), 5000);
        this.retryTimer = setTimeout(
          () => this.open(),
          delay + Math.random() * 250
        );
      }
    };
    ws.onerror = () => ws.close();
  }
  disconnect() {
    this.stopped = true;
    clearTimeout(this.retryTimer);
    clearTimeout(this.connectionTimer);
    clearTimeout(this.pongTimer);
    clearInterval(this.heartbeatTimer);
    document.removeEventListener('visibilitychange', this.resume);
    window.removeEventListener('online', this.resume);
    this.ws?.close(1000, 'Leaving room');
    this.listeners.clear();
  }
}
