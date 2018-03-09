"use strict";

const debug = require('debug')('bot:middlewares:libs');
const { Extra } = require('telegraf');



module.exports = (timeLock, textLock, keys = '%chat:%from') => {
	let locker = new Cache(timeLock);
	return (ctx, next) => {
		const key = keys.replace('%chat', ctx.chat.id).replace('%from', ctx.from.id);
		if(locker.get(key)) {
			if(textLock) ctx.reply(ctx.i18n.t(textLock));
			return debug(`${timeLock} ${textLock} ${keys}`);
		}
		locker.set(key, 1);
		next();
	}
};