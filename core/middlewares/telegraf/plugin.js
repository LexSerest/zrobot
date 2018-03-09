"use strict";


const { Router, Markup, Extra, Composer } = require('telegraf');

// добавляет функционал "Реагировать на сообщение бота"
class onReply{
	constructor(){
		this.messages = new Map();
	}

	middleware(){
		return (ctx, next) => {
			ctx.telegram.onReply = (chatId, text, func = Extra, extra = Extra) => {
				let isFunc = false;
				if(typeof(func) != "function" || func.name == "Extra") extra = func;
				else isFunc = true;

				return new Promise((ret, rej) => {
					ctx.telegram.sendMessage(chatId, text, extra.markup(Markup.forceReply())).then(e => {
						this.messages.set(e.message_id + ":" + chatId, isFunc ? func : ret);
					})
				})
			};

			ctx.onReply = (text, func = Extra, extra = Extra) => {
				ctx.telegram.onReply(ctx.chat.id, text, func, extra);
			};


			if(ctx.message && ctx.message.reply_to_message) {
				let id = ctx.message.reply_to_message.message_id + ":" + ctx.chat.id;
				let data = this.messages.get(id);
				if(data) {
					data(ctx);
					this.messages.delete(id);
				}
			}
			return next();
		}
	}
}

const onreply = new onReply();
bot.use(onreply.middleware());

// Роутер, для создания инлайн кнопок и удобной обработки
class iRouter {
	constructor(){
		this.map = new Map();
	}

	add(name, func){
		this.map.set(name, func);
	}

	callbackButton(text, name, data = []){
		return Markup.callbackButton(text, `${name}::${data.map(e=> (e + '').replace(/::/g, ':|:')).join('::')}`);
	}

	middleware(){
		return (ctx, next) => {
			if (!ctx.callbackQuery || !ctx.callbackQuery.data) return next();

			const parts = ctx.callbackQuery.data.split('::').map(e => e.replace(/:\|:/g, '::'));
			const name = parts[0];

			ctx.command = parts.slice(1, parts.length);
			if(this.map.has(name)) this.map.get(name)(ctx);

			return next();
		}
	}
}

const router = bot.router = api.router = new iRouter();
bot.use(router.middleware());


