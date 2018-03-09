"use strict";

const onlyAdminBot = libs.middlewares.onlyAdminBot();
const onlyPrivate = libs.middlewares.onlyPrivate();

class Admin {
	constructor(){
		this.init();
		this.menu = new Menu('admin_bot', require('./menu'));
	}

	init(){
		bot.cmd('admin', onlyPrivate, onlyAdminBot, ctx => {
			ctx.reply('Выберете команду', this.menu.extra(ctx));
		});

		bot.cmd('ver', ctx => {
			ctx.reply(api.version);
		});

		bot.cmd('save', onlyPrivate, onlyAdminBot, async ctx => {
			ctx.reply('save ' + (await api.db_save()));
		});

		bot.cmd('infodb', onlyPrivate, onlyAdminBot, async ctx => {
			let info = api.db_used();
			ctx.reply(`db info Chat:${info.chat} User:${info.user}`);
		})

	}


}


new Admin();