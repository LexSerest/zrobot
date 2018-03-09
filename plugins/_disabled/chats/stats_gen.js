"use strict";

const logger = require("mag")('bot:plugins:stats_gen');
const { Extra } = require('telegraf');

const remove_rtl = libs.funcs.remove_rtl;
const r_text = libs.funcs.r_text;
const smaller = libs.funcs.smaller;
const one_day = 1000 * 60 * 60 * 24;

module.exports = (day) => async ctx => {
	try {
		let nick = ctx.from.first_name;
		let msgId = ctx.message.message_id;

		let place = 0;
		let stats = '';
		let user_count = ctx.db.user.statistics[day];
		let count = ctx.db.chat.statistics[day];
		let date = new Date();
		let time = {
			today: date.getDate(),
			week: date.getWeek(),
			month: date.getMonth()
		};

		let maxAge = {
			today: +date - one_day * 2,
			week: +date - one_day * 8,
			month: +date - one_day * 32,
		};

		let findQuery = {chatId: ctx.chat.id};
		if (time[day]) {
			findQuery['statistics.current_' + day] = time[day];
			findQuery['updated'] = {$gt: maxAge[day] >> 0};
		}

		let statistic = (await (
			api.db.users.find(findQuery, {
				'id': 1,
				'first_name': 1,
				['statistics.' + day]: 1
			})
			.sort({['statistics.' + day]: -1})
			.limit(15))
			.toArray()
		);

		let i = 1;
		statistic.forEach((e) => {
			if (!e || !e.statistics || !e.statistics[day]) return; // wtf? null object?
			if (e.id === ctx.from.id) place = i;
			if (i < 16) {
				let first_name = r_text(smaller(e.first_name), true);
				stats += `<b>${i}.</b> ${first_name}: <b>${e.statistics[day]}</b>\n`
			}
			i++;
		});

		let data = {user_count, place: place ? place : '?', nick, count, day: ctx.i18n.t('chats.' + day), stats};
		let out = ctx.i18n.t('chats.top', data);
		ctx.replyWithHTML(remove_rtl(out), Extra.inReplyTo(msgId)).catch(e => {
		});
	} catch (e){
		logger.warn(e);
		ctx.reply('Sorry. Error :(');
	}
};


/*     <b>Топ 15</b> за <b>${day}</b>. Всего <b>${count}</b> сообщений
    <b>${nick}</b>, у вас <b>${user_count}</b>сообщений.
    Вы на <b>${place}</b> месте

    ${stats}


*/