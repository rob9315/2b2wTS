import { Proxy } from './proxy';
import { question } from './util';
import { ProxyOptions } from './config';
import dotenv from 'dotenv';
import cfg from 'config';
import { setup } from './setup';
import merge from 'deepmerge';

try {
  dotenv.config();
} catch {}
(async () => {
  if (process.argv.includes('config') || process.argv.includes('setup')) Object.assign(cfg, merge(cfg, await setup(merge(new ProxyOptions(), cfg.util.toObject(cfg)))));

  const proxy = new Proxy(merge(new ProxyOptions(), cfg.util.toObject(cfg)));

  (async () => {
    while (true) console.log(proxy.command(await question('$ ')));
  })();
})();
