import type { Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import type { Tokens } from './auth.ts';
import type { Hub } from './hub.ts';

const AUTH_TIMEOUT_MS = 5_000;
const HEARTBEAT_MS = 30_000;

/**
 * 토큰이 로그에 남지 않도록 주소가 아니라 첫 메시지로 인증합니다.
 * 보내기는 REST로 하고, 소켓은 받기 전용입니다.
 */
export function attachWebSocket(server: Server, hub: Hub, tokens: Tokens) {
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 8 * 1024 });
  const alive = new WeakSet<WebSocket>();

  wss.on('connection', (socket) => {
    let userId: string | undefined;
    alive.add(socket);
    socket.on('pong', () => alive.add(socket));
    socket.on('error', () => socket.terminate());

    const authTimer = setTimeout(() => socket.close(4401, 'auth timeout'), AUTH_TIMEOUT_MS);

    socket.on('message', async (raw) => {
      if (userId) return;
      try {
        const { type, token } = JSON.parse(raw.toString()) as { type: string; token: string };
        if (type !== 'auth') throw new Error('auth first');
        userId = await tokens.verifyAccess(token);
        clearTimeout(authTimer);
        hub.add(userId, socket);
        socket.send(JSON.stringify({ type: 'ready' }));
      } catch {
        socket.close(4401, 'unauthorized');
      }
    });

    socket.on('close', () => {
      clearTimeout(authTimer);
      if (userId) hub.remove(userId, socket);
    });
  });

  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (!alive.has(socket)) {
        socket.terminate();
        continue;
      }
      alive.delete(socket);
      socket.ping();
    }
  }, HEARTBEAT_MS);
  heartbeat.unref();
  wss.on('close', () => clearInterval(heartbeat));
  return wss;
}
