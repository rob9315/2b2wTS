import { WebServerOptions } from './config';
import { Server, createServer, IncomingMessage, ServerResponse } from 'http';
import type { Proxy } from './proxy';
import { readFileSync } from 'fs';

const html = readFileSync('webserver/index.html');
const css = readFileSync('webserver/index.css');
const particles = readFileSync('node_modules/particles.js/particles.js');
const app = readFileSync('node_modules/particles.js/demo/js/app.js');

export class WebServer {
  server?: Server;
  ETA: 'None' | string = 'None';
  queuePlace: 'None' | number = 'None';
  isInQueue: boolean = false;
  onStart: () => void;
  onStop: () => void;
  restartQueue: boolean = false;
  password: string;
  constructor(options: WebServerOptions | undefined, proxy: Proxy) {
    if (options) this.server = createServer(this.handleRequest).listen(options.port, options.host);
    this.onStart = proxy.startQueuing;
    this.onStop = proxy.stopQueuing;
    this.password = options?.password ?? '';
  }
  handleRequest(req: IncomingMessage, res: ServerResponse) {
    switch (req.url) {
      case '/':
        res.writeHead(200, { 'Content-type': 'text/html' });
        res.write(html);
        break;
      case '/index.css':
        res.writeHead(200, { 'Content-type': 'text/css' });
        res.write(css);
        break;
      case '/particles.css':
        res.writeHead(200, { 'Content-type': 'text/javascript' });
        res.write(particles);
        break;
      case '/app.js':
        res.writeHead(200, { 'Content-type': 'text/javascript' });
        res.write(app);
        break;
      default:
        if (this.password === '' || this.password === req.headers['xpassword'])
          switch (req.url) {
            case '/update':
              res.writeHead(200, { 'Content-type': 'text/json' });
              let json = Object.assign({}, this, { place: this.queuePlace });
              res.write(JSON.stringify(json));
              break;
            case '/start':
              res.writeHead(200);
              this.onStart();
              break;
            case '/stop':
              res.writeHead(200);
              this.onStop();
              break;
            case '/togglerestart':
              res.writeHead(200);
              this.restartQueue = !this.restartQueue;
              break;
            default:
              res.writeHead(404);
              break;
          }
        else res.writeHead(403);
        break;
    }
    res.end();
  }
}
