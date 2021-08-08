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

//temporary fix until there is top level await is officially supported in nodejs
(async () => {
  if (process.argv.includes('config') || process.argv.includes('setup') || JSON.stringify(cfg) == '{}') Object.assign(cfg, merge(cfg, await setup(merge(new ProxyOptions(), cfg.util.toObject(cfg)))));
  if (process.argv.includes('config')) process.exit(0);

  const proxy = new Proxy(merge(new ProxyOptions(), cfg));

  while (true) console.log(proxy.command(await question('$ ')));
})();
