import * as util from './util';
import { ProxyOptions } from './config';
import { writeFile } from 'fs';

const configQuestion = async (questionString: string, prevOption: string, blankStringValid?: boolean) => {
  let answer = await util.question(`${questionString} [${prevOption}]\n> `);
  return answer === '' || blankStringValid ? prevOption : answer;
};

const starString = (string: string) => '*'.repeat(string.length);

const isTrue = (string: string) => ['y', 'yes', 'true'].includes(string.toLowerCase());

const undefinedIfNone = (string: string) => (string === '' ? undefined : string);

const defaultConfig = new ProxyOptions();

export async function setup(config?: ProxyOptions) {
  config = config ?? new ProxyOptions();
  config.mcclient.username = await configQuestion('Please enter your minecraft email (or username if offline)', config.mcclient.username ?? 'user@example.com');
  let password = config.mcclient.username.match(/.+@.+\..+/) ? await configQuestion('Please enter your minecraft password', !!config.mcclient.password ? starString(config.mcclient.password) : 'password') : undefined;
  config.mcclient.password = starString(config.mcclient.password ?? '') === password ? config.mcclient.password : password;
  config.mcclient.host = await configQuestion('Enter the host you want to connect to', config.mcclient.host ?? '2b2t.org');
  config.mcclient.port = Number(config.mcclient.host === defaultConfig.mcclient.host ? 25565 : await configQuestion('Enter the port you want to connect to', `${config.mcclient.port ?? 25565}`));
  config.mcclient.version = config.mcclient.host !== '2b2t.org' ? await configQuestion('Please enter the version you want to connect as', config.mcclient.version ?? '1.12.2') : '1.12.2';
  config.mcserver['online-mode'] = config.mcclient.username.match(/.+@.+\..+/) ? isTrue(await configQuestion('Do you want to enable the whitelist? (only your account will be able to join, you will have to be logged in)', `${config.mcserver['online-mode'] ?? false}`)) : false;
  config.mcserver.host = await configQuestion('Please enter the hostname you want to host 2b2w on', config.mcserver.host ?? '0.0.0.0');
  config.mcserver.port = Number(await configQuestion('Please enter the port you want to host 2b2w on', `${config.mcserver.port ?? 25565}`));
  config.mcserver.version = config.mcserver.version ?? '1.12.2';
  config.webserver = isTrue(await configQuestion('Do you want to host the web-interface?', `${!!config.webserver ?? true}`))
    ? {
        host: await configQuestion('Please enter the host you want to host the web-interface on', `${config.webserver?.host ?? '0.0.0.0'}`),
        port: Number(await configQuestion('Please enter the port you want to host the web-interface on', `${config.webserver?.port ?? 80}`)),
        password: undefinedIfNone(await configQuestion('If you want to have a password for the web-interface, enter it here. Otherwise leave this blank.', config.webserver?.password ?? '', true)),
      }
    : null;
  let discord = { token: await configQuestion('Enter your discord bot Token if you want to use a discord bot. (more information on how to get one at https://github.com/rob9315/2b2wts/blob/master/README.md)', `${config.discord?.token ? `${config.discord.token.substring(0, config.discord.token.length > 5 ? 5 : config.discord.token.length - 2)}${config.discord.token.length > 5 ? starString(config.discord.token.substring(5, config.discord.token.length - 1)) : ''}` : ''}`) };
  config.discord = undefinedIfNone(discord.token)
    ? {
        token: discord.token,
        status: isTrue(await configQuestion('Do you want the status of the discord bot to be set to the current queue progress?', `${!!config.discord?.status ?? true}`)),
        commands: isTrue(await configQuestion('Do you want the bot to react to commands?', `${config.discord ? !!config.discord.commands : true}`))
          ? {
              prefix: await configQuestion('Please enter a prefix, can also be blank', config.discord?.commands?.prefix ?? '', true),
            }
          : undefined,
      }
    : null;
  config.extra = isTrue(await configQuestion('Do you want to set any of the extraOptions? (explanations to them available at https://github.com/rob9315/2b2wts/blob/master/README.md)', `${!!config.extra ?? false}`))
    ? {
        reconnect: isTrue(await configQuestion('Do you want to reconnect if an error occurred? (for example after a server restart)', `${config.extra ? !!config.extra.reconnect : true}`))
          ? {
              timeout: Number(await configQuestion('Enter a custom timeout after which to attempt a reconnection (in ms)', `${config.extra?.reconnect?.timeout ?? 30000}`)),
            }
          : undefined,
        //TODO add more
      }
    : undefined;
  let diff = returnDiff(config, defaultConfig);
  if (diff !== {} && isTrue(await util.question('Do you want to save your configuration?\n> '))) await new Promise((resolve) => writeFile('config/local.json', JSON.stringify(diff, null, 2), resolve));
  return config;
}

function returnDiff(userConf: { [key: string]: any } = {}, defaultConf: { [key: string]: any } = {}) {
  let diff: { [key: string]: any } = Object.assign({}, defaultConf, userConf);
  Object.keys(diff).forEach((key) => {
    if (defaultConf[key] === diff[key as keyof ProxyOptions]) return delete diff[key as keyof ProxyOptions];
    if (typeof diff[key] === 'object') diff[key] = returnDiff(diff[key as keyof ProxyOptions], defaultConf[key]);
  });
  return diff;
}
