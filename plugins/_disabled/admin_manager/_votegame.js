"use strict";

const {Markup, Extra} = require('telegraf');

class Vote {
	constructor(api){
		this.api = api;
		this.save = {}; // chat_id: {userid: {yes, no, name}}
		this.vote_time = this.api.config.vote_time; // in minute
	}

	init(){
		this.api.bot.command("voteban", ctx => {
			let reply_msg = ctx.message.reply_to_message || null;
			if(!reply_msg) return ctx.reply('Reply of message for use');
			let from = reply_msg.from;

			let name =  `${from.first_name}`+
						`${from.from.last_name ? ' ' + from.from.last_name : ''}` +
						`${from.from.username ? ' ' + from.from.username : ''}`;

			let chat_id = ctx.chat.id;
			let user_id = from.id;

			this.save[chat_id] = { [user_id]: {yes: 0, no: 0, name} };

			let button = Markup.inlineKeyboard([
				Markup.callbackButton("Tags", "vote:b_y:" + user_id),
				Markup.callbackButton("More", "vote:b_n:" + user_id),
			]);

			ctx.reply(`Do you want to ban ${name}? Voting is 1 hour.`, button.extra());
			this.timer(ctx.chat.id, from.id, name);
		});

		this.api.bot.queryRouter.on("vote", ctx => {
			let cmd = ctx.command;
			this.command(ctx, cmd[0], cmd[1]);
		})
	}

	command(ctx, cmd, user_id) {
		debug("command", cmd);

		let chat_id = ctx.chat.id;
		let list = {
			b_y: ctx => {
				this.save[chat_id][0]++;
			},

			b_n: ctx => {
				this.save[chat_id][1]++;
			}
		};
		if(list[cmd]) {
			ctx.editMessageReplyMarkup(this.button(user_id));
			list[cmd](ctx);
		}
	}

	timer(chatId, userId){
		setTimeout(() => {
			let u = this.save[chatId];
			if(u[0] > u[1]) {
				this.api.bot.telegram.kickChatMember(chatId, userId);
				this.api.bot.telegram.sendMessage(`User "${name}" win! He now banned!`);
			} else {
				this.api.bot.telegram.sendMessage(`User "${name}" lose... We did not banned :(`);
			}

			delete this.save[chatId];
		}, this.vote_time * 1000 * 60)
	}

	button(chatId, userId){
		let user = this.save[chatId] ? this.save[chatId][userId] ? this.save[chatId][userId] : false : false;

		if(!user) Markup.inlineKeyboard();
		return Markup.inlineKeyboard([
			Markup.callbackButton("👍 " + user.yes, "vote:b_y:" + userId),
			Markup.callbackButton("👎 " + user.no, "vote:b_n:" + userId),
		]);
	}
}

module.exports = {
	name: "vote_chat",
	version: "0.0.0",
	author: "LexSerest",
	description: "плангин для голосования и всего такого",
	init: (api) => new Vote(api)
};

