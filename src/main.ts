import { Proxy } from './proxy';
import cfg from 'config';
import { question } from './misc/util';
import { config } from 'dotenv';
import { ProxyOptions } from './misc/config';
import merge from 'deepmerge';
import { setup } from './misc/setup';

try {
  config();
} catch {}

//temporary fix until there is top level await is officially supported in nodejs
(async () => {
  if (process.argv.includes('config') || process.argv.includes('setup') || JSON.stringify(cfg) == '{}') Object.assign(cfg, merge(cfg, await setup(merge(new ProxyOptions(), cfg.util.toObject(cfg)))));
  if (process.argv.includes('config')) process.exit(0);

  const proxy = new Proxy(merge(new ProxyOptions(), cfg));

  while (true) await command(proxy, await question('$ '));
})();

async function command(proxy: Proxy, cmd: string | null) {
  switch (cmd?.split('0')[0]) {
    case null:
      break;
    case 'quit':
    case 'exit':
      process.exit(0);
    case 'start':
      if (['auth', 'connected', 'afk', 'queue'].includes(proxy.state)) return console.log('Proxy is already running!');
      proxy.state = 'auth';
      console.log('Started the Proxy!');
      break;
    case 'stop':
      if (proxy.state == 'idle') return console.log('Proxy was already stopped!');
      proxy.state = 'idle';
      console.log('Stopped the Proxy!');
      break;
    default:
      break;
  }
}
