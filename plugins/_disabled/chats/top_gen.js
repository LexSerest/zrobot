"use strict";

const logger = require("mag")('bot:plugins:top_gen');
const { Extra } = require('telegraf');

const remove_rtl = libs.funcs.remove_rtl;
const r_text = libs.funcs.r_text;
const smaller = libs.funcs.smaller;
const one_day = 1000 * 60 * 60 * 24;

module.exports = day => async ctx => {
	try {
		let place = 0;
		let stats = '';
		let count = 0;

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

		let findQuery = {
			$or: [
				{type: 'supergroup'},
				{type: 'group'}
			]
		};
		if (time[day]) {
			findQuery['statistics.current_' + day] = time[day];
			findQuery['updated'] = {$gt: maxAge[day] >> 0};
		}

		let result = (await (
			api.db.chats.find(findQuery, {
				'id': 1,
				'title': 1,
				'username': 1,
				['statistics.' + day]: 1
			})
			.sort({['statistics.' + day]: -1})
			.limit(15))
			.toArray()
		);

		let i = 1;
		result.forEach((e) => {
			if (!e || !e.statistics || !e.statistics[day]) return; // wtf? null object?
			if (!ctx.isPrivate && e.id === ctx.chat.id) {
				place = i;
				count = e.statistics[day];
			}
			if (i <= 15) {
				let title = r_text(smaller(e.title, 60), true);
				let url = e.username ? `<a href="http://t.me/${e.username}">${title}</a>` : title;
				stats += `\n<b>${i}.</b> ${url}: <b>${e.statistics[day]}</b>`
			}
			i++;
		});

		let txt_place = ( place ? ctx.i18n.t('chats.rating_place', {place}) + '\n' : '');
		let txt_count = ( count ? ctx.i18n.t('chats.rating_count', {
			count,
			day: ctx.i18n.t('chats.' + day)
		}) + '\n' : '');
		let out = ctx.i18n.t('chats.rating', {txt_place, txt_count, stats, day: ctx.i18n.t('chats.' + day)});
		ctx.replyWithHTML(remove_rtl(out), {disable_web_page_preview: true});
	} catch (e) {
		logger.warn(e);
		ctx.reply('Sorry. Error :( Please feedback');
	}
};

/*

  rating: |
    <b>Топ 15</b> чатов за <b>${day}</b>
    ${txt_place}${txt_count}

    ${stats}

  rating_place: <b>Ваш чат</b> на <b>${place}</b> месте.
  rating_count: |
    Cообщений: <b>${count}</b>.

  changeName: |
    <b>${name}</b>, давай я тебя спалю, твой старый ник - <b>${oldName}</b>

*/