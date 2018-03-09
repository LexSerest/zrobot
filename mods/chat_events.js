"use strict";

bot.on('left_chat_member', async (ctx, next) => {
	if(!ctx.message) return next();
	if(ctx.message.left_chat_participant.id === bot.id) {
		let chat = await ctx.dbChat();
		chat.isLeft = true;
	}
	return next();
});

bot.on('new_chat_members', async (ctx, next)  => {
	if(!ctx.message) return next();
	if(ctx.message.new_chat_participant.id === bot.id) {
		let chat = await ctx.dbChat();
		chat.isLeft = false;
	}
	return next();
});

bot.on('new_chat_title', async (ctx, next)  => {
	if(!ctx.message || !ctx.message.new_chat_participant) return next();
	if(ctx.message.new_chat_participant.id === bot.id) {
		let chat = await ctx.dbChat();
		chat.title = ctx.chat.title;
		chat.username = ctx.chat.username;
	}
	return next();
});

bot.on('migrate_to_chat_id', async (ctx, next)  => {
	if(!ctx.message) return next();
	if(ctx.message.new_chat_participant.id === bot.id) {
		let chat = await ctx.dbChat();
		chat.id = ctx.message.migrate_to_chat_id;
	}
	return next();
});
