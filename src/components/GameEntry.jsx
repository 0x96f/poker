import GameApp from './GameApp.jsx';

export default function GameEntry() {
  const match = window.location.pathname.match(
    /^\/game\/([a-zA-Z0-9_-]{1,64})\/?$/
  );
  if (!match)
    return (
      <main>
        <h1>Room not found</h1>
        <a href="/">Return home</a>
      </main>
    );
  return <GameApp gameId={match[1]} />;
}
