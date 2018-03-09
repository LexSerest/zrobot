"use strict";

bot.use((ctx, next) => {
	ctx.text = ctx.message ? ctx.message.text : false;
	ctx.isPrivate = ctx.chat.type === 'private';
	next();
});