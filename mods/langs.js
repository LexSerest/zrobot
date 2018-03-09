"use strict";

const logger = require("mag")('bot:mods:langs');

let cache = {};

bot.use(async (ctx, next) => {
	if(!ctx.message) return next();
	let cid = ctx.chat.id;

	ctx.changeLang = async (locale) => {
		if(locale) {
			let chat = await ctx.dbChat();
			chat.lang = locale;
		} else {
			locale = cache[cid] || ctx.message.from.language_code || 'ru'; // default lang
		}
		cache[cid] = locale;
		ctx.i18n.locale(locale);
		ctx.session.__i18n.locale = locale;
	};

	if(!cache[cid]){
		let lang_code = ctx.message.from.language_code || 'ru'; // default lang
		try {
			let chat = await api.db.chats.findOne({id: ctx.chat.id}, {lang: 1});
			if (chat) lang_code = chat.lang || lang_code;
		} catch (e){
			logger.warn(e);
		}
		cache[cid] = lang_code;
	}

	await ctx.changeLang();

	return next();
});
