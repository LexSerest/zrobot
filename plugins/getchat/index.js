"use strict";

function r(ctx){
	ctx.reply(ctx.i18n.t('function_off'));
}

bot.cmd(['week', 'неделя', 'today', 'сегодня', 'month', 'месяц', 'stats', 'стата', 'top', 'topweek', 'topmonth', 's', 'si'], r);


bot.cmd('getchat', async ctx => {
	let chats = api.tempChat;
	let chats_u = Object.keys(chats).filter(e => chats[e].username);

	let chat = chats[libs.funcs.rand(chats_u)];
	if(chat) ctx.replyWithHTML(ctx.i18n.t('randChat', {title: chat.title, username: chat.username})).catch(e => {});
	else ctx.reply(ctx.i18n.t('randChat_empty'))
});