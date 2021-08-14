import {escapeRegExp} from "./util.js";
export async function onDiscordMessage(msg) {
  if (!!this.discord && !!this.options.discord?.commands && (!this.options.discord?.commands.allowedIds || this.options.discord?.commands.allowedIds?.includes(msg.author.id)) && msg.author.id !== this.discord.user?.id && !!msg.content.match(`^${escapeRegExp(this.options.discord?.commands?.prefix ?? "")}`))
    try {
    } catch {
    }
}
