"use strict";

const { Extra } = require('telegraf');

// require('./speak');

bot.hears(/^(бот|bot)(.+)?\?/i, (ctx, next) => {
	let msgID = ctx.message.message_id;
	let txt = (Math.random() * 2 >> 0) ? ctx.i18n.t('rnd_yes') : ctx.i18n.t('rnd_no');
	ctx.reply(txt, Extra.inReplyTo(msgID)).catch(e => {});
	next()
});

bot.cmd('me', ctx => {
	if(!ctx.text) return;
	ctx.replyWithMarkdown(`\\* *${ctx.from.first_name}* ${ctx.text}`).catch(e => {});
	if(!ctx.isPrivate) ctx.deleteMessage().catch(e => {})
});