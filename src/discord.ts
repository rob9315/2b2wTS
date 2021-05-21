import djs from 'discord.js';

import type { Proxy } from './proxy';
import { escapeRegExp } from './util';

export async function onDiscordMessage(this: Proxy, msg: djs.Message) {
  if (!!this.discord && !!this.options.discord?.commands && (!this.options.discord?.commands.allowedIds || this.options.discord?.commands.allowedIds?.includes(msg.author.id)) && msg.author.id !== this.discord.user?.id && !!msg.content.match(`^${escapeRegExp(this.options.discord?.commands?.prefix ?? '')}`))
    try {
      await msg.reply(this.command(msg.content.substring(this.options.discord?.commands?.prefix.length ?? 0)));
    } catch {}
}
