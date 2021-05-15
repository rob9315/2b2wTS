import { Proxy } from './proxy';
import dtenv from 'dotenv';
import { question } from './util';

let { error } = dtenv.config();
if (!!error) {
  console.error(error);
  process.exit(1);
}

const proxy = new Proxy(JSON.parse(process.env['NODE_CONFIG'] as string));

(async () => {
  while (true) console.log(proxy.command(await question('$ ')));
})();
