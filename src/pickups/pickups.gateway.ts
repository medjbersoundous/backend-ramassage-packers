import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true }) 
export class PickupsGateway {
  @WebSocketServer() server: Server;
  notifyChange() {
    this.server.emit('pickupsChanged'); 
  }
}
