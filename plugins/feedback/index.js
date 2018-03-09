"use strict";


const {Markup, Extra} = require('telegraf');

let ignore = [];
let userReply = {};
let adminReply = {};

const sendUser = (ctx, userId, message_id) => {
	bot.telegram.sendCopy(userId, ctx.message, Extra.markdown().inReplyTo(message_id))
	.then(e => {
		if(!e) return;
		userReply[userId] = e.message_id;
		ctx.reply('Отправленно')
	})
	.catch(e => {
		ctx.reply('Ошибка отправления :(')
	})
};

const sendAdmin = (userId, ctx) => {
	let name = ctx.from.first_name.slice(0, 15) +
		(ctx.from.username ? ' @'+ ctx.from.username : '') +
		(ctx.chat.title ? '\nChat: ' + ctx.chat.title.slice(0, 15) : '') +
		(ctx.chat.username && !ctx.isPrivate ? ' @' + ctx.chat.username : '') +
		'\n\n';

	ctx.message.text = name +
		(ctx.message.text ? ctx.message.text : '') + '\n' +
		(ctx.message.caption ? ctx.message.caption : '');

	ctx.telegram.sendCopy(api.config.admin_id, ctx.message,
		Extra
		.HTML()
		.markup(
			Markup.inlineKeyboard([
				api.router.callbackButton("Forward", 'feedback', [userId, ctx.message.message_id, 'forward']),
				api.router.callbackButton("Ignore", 'feedback', [userId, ctx.message.message_id, 'ig']),
				api.router.callbackButton("Reply", 'feedback', [userId, ctx.message.message_id, 'o'])
			],
			{columns: 3}
		)))
	.then(e => {
		adminReply[e.message_id] = userId;
	})
};


bot.hears(/^\/\/(.+)/, ctx => {
	let userId = ctx.chat.id;
	let isPrivate = ctx.chat.type === 'private';

	if(ignore.includes(userId)) {
		if(isPrivate) ctx.reply(ctx.i18n.t("feedback.ban"));
		return;
	}

	if(ctx.match[1]){
		ctx.message.text = ctx.match[1];
		sendAdmin(userId, ctx);
		if(isPrivate) ctx.reply(ctx.i18n.t("feedback.thanks"));
	}
});

bot.on('text', (ctx, next) => {
	if(!ctx.message || !ctx.message.reply_to_message) return next();

	let reply_msg = ctx.message.reply_to_message;
	if(userReply[ctx.chat.id] === reply_msg.message_id) {
		sendAdmin(ctx.chat.id, ctx);
	}

	return next();
});

api.router.add("feedback", ctx => {
	if(ctx.from.id !== api.config.admin_id) return;

	let userId = +ctx.command[0];
	let message_id = ctx.command[1];
	let type = ctx.command[2];

	switch (type){
		case 'ig':
			let id = ignore.indexOf(userId);
			if(!~id) {
				ignore.push(userId);
				ctx.answerCbQuery("mute user");
			} else {
				ignore.splice(id, 1);
				ctx.answerCbQuery("unmute user");
			}
		break;

		case 'forward':
			bot.telegram.forwardMessage(api.config.admin_id, userId, message_id);
		break;

		case 'user':
			ctx.answerCbQuery(message_id);
		break;

		case 'o':
			ctx.telegram.onReply(ctx.from.id, "Enter your text.", ctx => {
				sendUser(ctx, userId, message_id);
			});
		break;
	}
});

