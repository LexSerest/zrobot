"use strict";

const { Extra } = require('telegraf');
const debug = require('debug')('bot:middlewares:libs');

module.exports = (isReply, privilege) => {
	//if(!Array.isArray(privilege)) privilege = [privilege];

	return async (ctx, next) => {
		if (ctx.chat.type === 'private') return next();
		let data = await ctx.telegram.getChatMember(ctx.chat.id, bot.id);
		if (data.status === 'administrator') return next();

		debug('bot is not admin');
		return isReply ?
			ctx.reply(
				ctx.i18n.t('bot.is-not-admin'),
				Extra.inReplyTo(ctx.message.message_id)
			) : false;

	};
};