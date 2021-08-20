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
  switch (cmd?.split(' ')[0]) {
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
    case 'info':
      console.log(
        `-----CONFIG-----
client:    ${proxy.conn?.bot.username} (${proxy.options.mcclient.username})
remote:    ${proxy.options.mcclient.host}:${proxy.options.mcclient.port}
mcserver:  ${proxy.options.mcserver.host}:${proxy.options.mcserver.port}
webserver: ${proxy.options.webserver ? proxy.options.webserver.host + ':' + proxy.options.webserver.port : 'disabled'}
discord:   ${proxy.options.discord ? proxy.discord?.user?.tag : 'disabled'}
-----STATE-----
current:   '${proxy.state}'`
      );
      switch (proxy.state) {
        case 'connected':
        case 'afk':
          console.log(`-----INGAME-----
position:  ${proxy.conn?.bot.entity.position}
health:    ${(proxy.conn?.bot.health ? proxy.conn?.bot.health.toString() : '?').padStart(2)}/20`);
      }
      if (proxy.conn && proxy.conn.pclients.length > 0)
        console.log(`-----CONNS-----
main:      ${proxy.conn?.pclient ? `${proxy.conn.pclient?.username} (${proxy.conn.pclient?.socket.remoteAddress}:${proxy.conn.pclient?.socket.remotePort})` : 'nobody'}
others:    ${proxy.conn && proxy.conn.pclients.length > 1 ? proxy.conn?.pclients.map((client) => (client != proxy.conn?.pclient ? `\n - ${client.username}  (${proxy.conn?.pclient?.socket.remoteAddress}:${proxy.conn?.pclient?.socket.remotePort})` : '')).join('') : 'none'}`);
      break;
    case 'wl':
    case 'whitelist':
      switch (cmd.split(' ')[1]) {
        case 'add':
          if (!cmd.split(' ')[3]) {
            console.log('`whitelist add` takes at least one name as argument after.');
            break;
          }
          proxy.options.mcserver.whitelist ??= [];
          cmd
            .split(' ')
            .filter((_, i) => i > 1)
            .forEach((name) => {
              if (proxy.options.mcserver.whitelist?.includes(name)) console.log(`Didn't add '${name}' to whitelist because whitelist already contains that username`);
              else proxy.options.mcserver.whitelist?.push(name);
            });
          break;
        case 'remove':
          if (!cmd.split(' ')[3]) {
            console.log('`whitelist add` takes at least one name as argument after.');
            break;
          }
          cmd
            .split(' ')
            .filter((_, i) => i > 1)
            .forEach((name) => {
              if (!proxy.options.mcserver.whitelist?.includes(name)) console.log(`Didn't remove '${name}' from whitelist because whitelist did not contains that username`);
              else proxy.options.mcserver.whitelist = proxy.options.mcserver.whitelist.filter((wlname) => wlname != name);
            });
          break;
        case 'list':
          console.log(`Players currently on the whitelist: ${proxy.options.mcserver.whitelist?.join(', ')}`);
          break;
        default:
          console.log(`wrong useage of whitelist command, examples below:

whitelist (add|remove) Notch
whitelist list`);
          break;
      }
      break;
    default:
      console.log('Unknown command');
      break;
  }
}
