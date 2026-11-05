import type { WebSocket } from 'ws';

/** 사용자별 소켓 목록입니다. 서버를 여러 대로 늘리면 Redis pub/sub 등으로 교체해야 합니다. */
export class Hub {
  private sockets = new Map<string, Set<WebSocket>>();

  add(userId: string, socket: WebSocket): void {
    const set = this.sockets.get(userId) ?? new Set();
    set.add(socket);
    this.sockets.set(userId, set);
  }

  remove(userId: string, socket: WebSocket): void {
    const set = this.sockets.get(userId);
    set?.delete(socket);
    if (set?.size === 0) this.sockets.delete(userId);
  }

  send(userId: string, event: unknown): void {
    const data = JSON.stringify(event);
    for (const socket of this.sockets.get(userId) ?? []) {
      if (socket.readyState === socket.OPEN) socket.send(data);
    }
  }

  disconnect(userId: string): void {
    for (const socket of this.sockets.get(userId) ?? []) socket.close(4401, 'account deleted');
  }
}
