"use strict";

const debug = require('debug')('bot:middlewares:libs');
const { Extra } = require('telegraf');

module.exports = () => {
	return async (ctx, next) => {
		if(ctx.chat.type === 'private') return next();
		const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id).catch(debug);
		if (member && (
				(member.status === 'creator') ||
				(member.status === 'administrator') ||
				(ctx.from.id === api.config.admin_id)
			)) {
			return next()
		}
		debug('only admin');
		return ctx.reply(ctx.i18n.t('bot.access-denied'), Extra.inReplyTo(ctx.message.message_id))
	}
};