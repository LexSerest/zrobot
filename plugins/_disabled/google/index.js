"use strict";

const request = require('request-promise-native');
const querystring = require('querystring');
const { Extra } = require('telegraf');
const debug = require('debug')('bot:plugin:google');

let cache = new Map();


// safe - off, high, medium
async function search(txt, type, ctx){
	let lang = ctx.db.chat.lang === 'ru' ? 'lang_ru' : 'lang_en';
	//let safe = ctx.db..user.search_unsafe ? 'off' : 'medium';

	let cachestr = `${txt}::${type}`;

	let param = {
		key: 'AIzaSyB_RQgtQkI7dymVU7xdVXDfp6GydhLjHfg',
		cx: '001660557850645180357:wp-6_3lv9o4',
		q: txt,
		lr: lang,
		safe: 'medium'
	};
	if(type === 'wiki') {
		param.cx = '001660557850645180357:mzcpqbdvqmq';
		param.num = 1;
	}
	if(type === 'img') param.searchType = 'image';


	let url = 'https://www.googleapis.com/customsearch/v1?' + querystring.stringify(param);
	try {
		let data = false;
		let json = false;
		if(!cache.has(cachestr)){
			data = await request(url);
			if(data) json = JSON.parse(data);
		} else {
			json = {items: cache.get(cachestr)};
		}


		if(!json || !json.items) return ctx.reply(ctx.i18n.t('google_empty'));
		if(!json.items.length) return ctx.reply(ctx.i18n.t('google_empty'));
		cache.set(cachestr, json.items);
		let item = libs.funcs.rand(json.items);
		let extra = Extra.inReplyTo(ctx.message.message_id);

		switch (type){
			case 'img':
				ctx.replyWithPhoto({url: item.link}, extra)
				.catch(e => ctx.reply(ctx.i18n.t('google_error_img')));
			break;

			case 'wiki':
				ctx.reply(`${decodeURI(item.link)}`, extra)
				.catch(e => ctx.reply(ctx.i18n.t('google_error')));
			break;

			case 'google':
				ctx.reply(`${item.title}\n${decodeURI(item.link)}`, extra)
				.catch(e => ctx.reply(ctx.i18n.t('google_error')));
			break;
		}
	} catch (e){
		ctx.reply(ctx.i18n.t('google_error'), Extra.inReplyTo(ctx.message.message_id));
	}
}

bot.cmd(['s', 'g', 'гугль'], ctx => search(ctx.text, 'google', ctx));
bot.cmd(['пикча','gi','si'], ctx => search(ctx.text, 'img', ctx));
bot.cmd(['вики', 'wiki'], ctx => search(ctx.text, 'wiki', ctx));
