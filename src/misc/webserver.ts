import { Server } from 'http';
import serveStatic from 'serve-static';
import { Socket, Server as IO } from 'socket.io';

import type { Proxy } from '../proxy';
import type { WebServerOptions } from './config';

export class WebServer extends Server {
  private serve = serveStatic('./frontend');
  private io = new IO({ serveClient: true }).listen(this);
  private sockets = <Socket[]>[];
  constructor(public options: WebServerOptions, private proxy: Proxy) {
    super((req, res) => this.serve(req, res, () => {}));
    this.listen(this.options.port, this.options.host);
    this.io
      .use((socket, next) => {
        if (!this.options.password && this.options.password == socket.request.headers.authorization) next();
        else next(new Error('ClientError'));
      })
      .on('connect', (socket) => {
        this.sockets.push(socket);
        socket.emit('update', this.status);
      })
      .on('start', () => {
        if (this.proxy.state === 'idle') this.proxy.state = 'auth';
      })
      .on('stop', () => (this.proxy.state = 'idle'));
  }
  get status() {
    return {
      state: this.proxy.state,
      queue: this.proxy.getqueue,
    };
  }

  update() {
    const status = this.status;
    this.sockets.forEach((socket) => socket.emit('update', status));
  }
}
