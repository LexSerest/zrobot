"use strict";

const onlyAdmin = libs.middlewares.onlyAdmin(true);

bot.cmd(['set_ru', 'set_en'], onlyAdmin, ctx => {
	const lang = ctx.command.endsWith('ru') ? 'ru' : 'en';
	ctx.changeLang(lang);
	ctx.reply(ctx.i18n.t('setlang_' + lang));
});

bot.cmd('cur_lang', onlyAdmin, async ctx => {
	let db = await ctx.dbChat();
	ctx.reply(ctx.i18n.t('setlang_' + db.lang));
});
