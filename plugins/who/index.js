"use strict";

const { Extra } = require('telegraf');
const debug = require('debug')('bot:plugins:who');
const onlyGroup = libs.middlewares.onlyGroup(true);
const onlyAdmin = libs.middlewares.onlyAdmin(true);



bot.cmd(['who_on', 'who_off'], onlyGroup, onlyAdmin, async ctx => {
	let db = await ctx.dbChat();
	let whoEnabled = db.whoEnabled = ctx.command.endsWith('on');
	ctx.reply(ctx.i18n.t('who_' + (whoEnabled ? 'on' : 'off')))
});


bot.cmd('who', onlyGroup, async ctx => {
	let today = +new Date();
	let db = await ctx.dbChat();

	if(!db.whoEnabled) return ctx.reply(ctx.i18n.t('who_off'));
	if(!db.who) db.who = {};
	if(db.who.date > today - 1000 * 60 * 60 * 24) {
		let first_name = db.who.first_name;
		let username = db.who.username || '';
		let type = db.who.type;
		return ctx.replyWithHTML(ctx.i18n.t('who', {
			first_name,
			username: (username ? '@' : '') + username,
			text: ctx.i18n.t('who_' + type)
		}));
	}


	let user = libs.funcs.rand(api.tempUser[ctx.chat.id]);
	if(user){
		db.who.date = today;
		let first_name = db.who.first_name = user.first_name;
		let username = db.who.username = user.username || '';
		let type = db.who.type = libs.funcs.rand(5) + 1;
		ctx.replyWithHTML(ctx.i18n.t('who', {
			first_name, username: (username ? '@' : '') + username, text: ctx.i18n.t('who_' + type)
		}));
	} else {
		ctx.reply(ctx.i18n.t('who_not_find'));
	}
});