"use strict";

const debug = require('debug')('bot:middlewares:libs');
const { Extra } = require('telegraf');

module.exports = isReply => {
	return (ctx, next) => {
		if(ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') return next();
		debug('only group');
		return isReply ?
			ctx.reply(
				ctx.i18n.t('bot.only-group'),
				Extra.inReplyTo(ctx.message.message_id)
			) : false;
	}
};