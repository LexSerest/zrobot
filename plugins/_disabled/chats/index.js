"use strict";


const logger = require("mag")('bot:plugins:chats');
const onlyGroup = libs.middlewares.onlyGroup(true);

const stats_gen = require('./stats_gen');

function r(ctx){
	ctx.reply(ctx.i18n.t('function_off'));
}

bot.cmd(['week', 'неделя', 'today', 'сегодня', 'month', 'месяц', 'stats', 'стата', 'top', 'topweek', 'topmonth'], r);

// bot.cmd(['today', 'сегодня'], onlyGroup, stats_gen('today'));
// bot.cmd(['week', 'неделя'], onlyGroup, stats_gen('week'));
// bot.cmd(['month', 'месяц'], onlyGroup, stats_gen('month'));
// bot.cmd(['stats', 'стата'], onlyGroup, stats_gen('all'));


const top_gen = require('./top_gen');
// bot.cmd('top', top_gen('today'));
// bot.cmd('topweek', top_gen('week'));
// bot.cmd('topmonth', top_gen('month'));

bot.cmd('getchat', async ctx => {
	try {
		let chatCursor = await api.db.chats.find(
			{
				type: 'supergroup',
				$and: [{username: {$exists: true}}, {username: {$ne: null}}],
				'statistics.current_today': new Date().getDate()
			}, {
				username: 1,
				title: 1,
				'statistics.today': 1
			}
		);

		let chatCount = await chatCursor.count();
		let chat = (await chatCursor.skip(libs.funcs.rand(chatCount - 1)).limit(1).toArray());

		if (!chat || !chat[0] || !chat[0].title) return ctx.reply(ctx.i18n.t('rndchat_error')).catch(e => {
		});

		let title = chat[0].title;
		let username = chat[0].username;
		let today = chat[0].statistics.today;

		ctx.replyWithHTML(ctx.i18n.t('randChat', {title, username, today})).catch(e => {
		});

	} catch (e) {
		logger.warn('getchat', e);
		ctx.reply('Sorry. Error :( Please feedback');
	}
});

bot.cmd('topflood', async ctx => {
	let i = 1;
	let out = ctx.i18n.t('chats.topflood') + '\n\n';
	try {
		let cursor = await (api.db.users.find({
			type: {$in: ['supergroup', 'group']},
		}, {
			'id': 1,
			'first_name': 1,
			'updated': {$gt: (+new Date() - 1000 * 60 * 60 * 24) >> 0},
			['statistics.today']: 1
		})
		.sort({['statistics.today']: -1})
		.limit(15)).toArray();

		cursor.forEach(e => {
			out += `<b>${i}</b>. ${libs.funcs.r_text(e.first_name)}: <b>${e.statistics.today}</b>\n`;
			i++;
		});

		ctx.replyWithHTML(out).catch(e => {});
	} catch (e) {
		logger.warn('topflood', e);
		ctx.reply('Sorry. Error :( Please feedback');
	}
})