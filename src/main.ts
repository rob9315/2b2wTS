import { Proxy } from './proxy';
import { question } from './util';
import { ProxyOptions } from './config';
import dotenv from 'dotenv';
import cfg from 'config';
import { setup } from './setup';

try {
  dotenv.config();
} catch {}
(async () => {
  if (process.argv.includes('config')) Object.assign(cfg, await setup(Object.assign(new ProxyOptions(), cfg.util.toObject(cfg))));

  const proxy = new Proxy(Object.assign(new ProxyOptions(), cfg.util.toObject(cfg)));

  (async () => {
    while (true) console.log(proxy.command(await question('$ ')));
  })();
})();
