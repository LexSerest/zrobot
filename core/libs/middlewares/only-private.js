"use strict";

const debug = require('debug')('bot:middlewares:libs');
const { Extra } = require('telegraf');

module.exports = isReply => {
	return (ctx, next) => {
		if(ctx.chat.type === 'private') return next();
		debug('only private');
		return isReply ?
			ctx.reply(
				ctx.i18n.t('bot.only-private'),
				Extra.inReplyTo(ctx.message.message_id)
			) : false;
	}
};