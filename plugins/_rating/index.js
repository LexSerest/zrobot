"use strict";

const _ = require('lodash');
const { Extra } = require('telegraf');
const onlyGroup = libs.middlewares.onlyGroup();
const onlyGroupReply = libs.middlewares.onlyGroup(true);
const onlyAdmin = libs.middlewares.onlyAdmin(true);
const locker = libs.middlewares.locker(20000); // поправить

const remove_rtl = libs.funcs.remove_rtl;
const r_text = libs.funcs.r_text;


bot.hears(/^([+-])(\d+)?/, onlyGroup, locker, async (ctx, next) => {
	let db = ctx.dbChat();
	if( db.karmaDisabled ||
		!ctx.message ||
		!ctx.message.reply_to_message
	) return next();

	const reply_msg = ctx.message.reply_to_message;
	const id = reply_msg.from.id;
	const isAdminBot = ctx.from.id === api.config.admin_id;

	let type = ctx.match[1] === '+' ? 1 : -1;

	if(isAdminBot) {
		let admin = +ctx.match[2] * type || false;
		type = admin ? admin : type;
	}
	if(!isAdminBot && (id === ctx.from.id)) return next();

	let dbReplayUser = ctx.dbReplyUser();
	if(!dbReplayUser.karma) dbReplayUser.karma = 0;
	dbReplayUser.karma += type;

	return next();
});

bot.cmd(['rating_on', 'rating_off'], onlyGroupReply, onlyAdmin, async ctx => {
	let db = ctx.dbChat();
	let isDisabled = ctx.command.endsWith('off');
	db.karmaDisabled = isDisabled;
	ctx.reply(ctx.i18n.t('rating_' + (isDisabled ? 'off' : 'on') ));
});

bot.cmd('rating', onlyGroupReply, async ctx => {
	let db = ctx.dbChat();
	if(db.karmaDisabled === true) return ctx.reply(ctx.i18n.t('rating_off'));

	let nick = ctx.from.first_name;
	let place = 0;
	let count = 0;
	let stats = '';
	let msgId = ctx.message.message_id;
	let user = 0;

	let data = await (
		api.db.users
		.find({
			chatId: ctx.chat.id
		}, {
			'id': 1,
			'first_name': 1,
			'karma': 1
		})
		.sort({'karma': -1})
		.toArray()
	);

	data.forEach((e, i) => {
		if(e.karma) {
			if (e.id === ctx.from.id) {
				place = i + 1;
				user = e.karma
			}
			if (count < 15) {
				const txt = (e.karma > 0 ? '+' : '') + e.karma;
				const small = libs.funcs.smaller(e.first_name);
				stats += `<b>${i + 1}.</b> ${small}: <b>${txt}</b>\n`;
				count++;
			}
		}
	});

	let rating_you = place ? ctx.i18n.t('rating_you', {place}) : '';
	if(!stats) stats = ctx.i18n.t('rating_empty');

	let out = ctx.i18n.t('rating', {nick, rating_you, stats, user});
	ctx.replyWithHTML(remove_rtl(out), Extra.inReplyTo(msgId)).catch(e => {});;
});



