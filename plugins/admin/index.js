"use strict";


const onlyAdmin = libs.middlewares.onlyAdmin(true);
const onlyGroup = libs.middlewares.onlyGroup(true);
const onlyBotAdmin = libs.middlewares.botIsAdmin(true);

function convert_date(date_string) {

	const dates = {
		s: 1,
		m: 60,
		h: 60 * 60,
		d: 60 * 60 * 24
	};

	let date = +new Date / 1000 >> 0;
	let match = date_string.match(/([0-9]+[smhd])+?/gi);
	if(match && match.length) match.forEach( e => {
		let m = e.match(/([0-9]+)([smhd])/i);
		date += +m[1] * dates[m[2]]
	});

	return date;
}

function error(ctx) {
	return function(e) {
		ctx.reply(ctx.i18n.t('admin.ican'))
	}
}

bot.cmd('ban', onlyGroup, onlyAdmin, onlyBotAdmin, ctx => {
	let replyMsg = ctx.message.reply_to_message;
	if (!replyMsg) return ctx.reply(ctx.i18n.t('admin.plzreply'));
	let id = replyMsg.from.id;
	let until_date = false;

	if (ctx.command) until_date = convert_date(ctx.text);


	if (until_date) {
		ctx.telegram.kickChatMember(ctx.chat.id, id, {until_date}).catch(error)
	} else {
		ctx.telegram.kickChatMember(ctx.chat.id, id).catch(error)
	}
});

bot.cmd('kick', onlyGroup, onlyAdmin, onlyBotAdmin, ctx => {
	let replyMsg = ctx.message.reply_to_message;
	if(!replyMsg) return ctx.reply(ctx.i18n.t('admin.plzreply'));
	let id = replyMsg.from.id;


	ctx.telegram.kickChatMember(ctx.chat.id, id, {until_date: +new Date() + 60 * 40}).catch(error(ctx))

});


bot.cmd('unban', onlyGroup, onlyAdmin, onlyBotAdmin, ctx => {
	let replyMsg = ctx.message.reply_to_message;
	if(!replyMsg) return ctx.reply(ctx.i18n.t('admin.plzreply'));
	let id = replyMsg.from.id;

	ctx.telegram.unbanChatMember(ctx.chat.id, id).catch(error(ctx))
});


bot.cmd('mute', onlyGroup, onlyAdmin, onlyBotAdmin, ctx => {
	let replyMsg = ctx.message.reply_to_message;
	if(!replyMsg) return ctx.reply(ctx.i18n.t('admin.plzreply'));
	let id = replyMsg.from.id;
	let until_date = false;

	if(ctx.command) until_date = convert_date(ctx.text);
	if(until_date){
		ctx.telegram.restrictChatMember(ctx.chat.id, id, {until_date, can_send_messages: false}).catch(error(ctx))
	} else {
		ctx.telegram.restrictChatMember(ctx.chat.id, id, {can_send_messages: false}).catch(error(ctx))
	}
});

bot.cmd('unmute', onlyGroup, onlyAdmin, onlyBotAdmin, ctx => {
	let replyMsg = ctx.message.reply_to_message;
	if(!replyMsg) return ctx.reply(ctx.i18n.t('admin.plzreply'));
	let id = replyMsg.from.id;

	ctx.telegram.restrictChatMember(ctx.chat.id, id, {
		can_send_messages: true,
		can_send_media_messages: true,
		can_send_other_messages: true,
		can_add_web_page_previews: true
	}).catch(error(ctx))
});