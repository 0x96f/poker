const ROOM_ID = '[a-zA-Z0-9_-]{1,64}';
const backendRoute = new RegExp(`^/(ws|api/game)/(${ROOM_ID})$`);
const gameRoute = new RegExp(`^/game/(${ROOM_ID})/?$`);

export async function routeRequest(request, env) {
  const url = new URL(request.url);
  const match = url.pathname.match(backendRoute);
  if (match) {
    if (request.method !== 'GET')
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET' },
      });
    if (match[1] === 'ws') {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket')
        return new Response('WebSocket upgrade required', { status: 426 });
      const origin = request.headers.get('Origin');
      if (origin && origin !== url.origin)
        return new Response('Origin not allowed', { status: 403 });
    }
    return env.ROOMS.getByName(match[2]).fetch(request);
  }
  if (url.pathname.startsWith('/ws/') || url.pathname.startsWith('/api/game/'))
    return new Response('Invalid room ID', { status: 400 });
  if (gameRoute.test(url.pathname)) {
    if (!['GET', 'HEAD'].includes(request.method))
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD' },
      });
    // Serve the static shell without redirecting the public room URL.
    url.pathname = '/game.html';
    return env.ASSETS.fetch(new Request(url, request));
  }
  if (url.pathname === '/') {
    url.pathname = '/index.html';
    return env.ASSETS.fetch(new Request(url, request));
  }
  return env.ASSETS.fetch(request);
}
