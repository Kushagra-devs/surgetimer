import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';
import type { RealtimeEnvelope } from '@horse-timer/types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  broadcast<TPayload>(type: string, payload: TPayload): void {
    const envelope: RealtimeEnvelope<TPayload> = {
      version: 1,
      type,
      emittedAt: new Date().toISOString(),
      payload,
    };
    this.server.emit(type, envelope);
  }
}

