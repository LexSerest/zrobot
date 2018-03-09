"use strict";

const { Composer } = require('telegraf');
const debug = require('debug')('bot:telegraf:composer');

Composer.cmd = (command, opt, middleware) => {
	let prefix = opt.prefix !== undefined ? opt.prefix : '/';
	let notEmptyName = opt.notEmptyName;                    // работает, только если /command@username

	if(!Array.isArray(command)) command = [command];
	command = command.map(e => e.startsWith(prefix) ? e : `${prefix}${e}`);

	return Composer.mount('text', Composer.lazy((ctx) => {
		let text = ctx.message.text;

		if(!text) return Composer.safePassThru();

		const isGroup = ctx.chat.type === 'supergroup';
		const groupCommand = ctx.me && isGroup ? command.map(e => `${e}@${ctx.me}`) : false;

		let cmdGroup = null;
		let cmdOnly = null;
		if(groupCommand) groupCommand.map( e => text.startsWith(e) ? cmdGroup = e : false);
		command.map( e => text.startsWith(e) ? cmdOnly = e : false);

		const cmd = cmdGroup ? cmdGroup : cmdOnly && (!isGroup || !notEmptyName) ? cmdOnly : false;

		if(cmd) text = text.substr(text.indexOf(cmd) + cmd.length, text.length);

		if(cmd && (!text || text.startsWith(' '))){
			ctx.command = cmd.replace('@' + bot.username, '');
			ctx.text = text.trim();
			return async (ctx, next) => {
				await middleware(ctx);
				next()
			}  // fork - выполнение последующих middleware
		}
		return Composer.safePassThru();
	}))
};

Composer.prototype.cmd = function(command, opt, ...fns) {
	if(typeof opt === 'function') {
		fns.unshift(opt);
		opt = {}
	}
	return this.use(Composer.cmd(command, opt, Composer.compose(fns)))
};

