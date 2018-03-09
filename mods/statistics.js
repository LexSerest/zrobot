"use strict";


let cache_user = {};
let cache_chat = {};

bot.use(async (ctx, next) => {
	if(!ctx.message || !ctx.message.text) return next();
	if(ctx.isPrivate){
		cache_user[ctx.from.id] = {
			first_name: ctx.from.first_name,
			message: ctx.message.text.slice(0, 100),
			username: ctx.from.username,
			date: +new Date()
		}
	} else {
		cache_chat[ctx.chat.id] = {
			title: ctx.chat.title,
			message: ctx.message.text.slice(0, 100),
			username: ctx.chat.username,
			date: +new Date()
		}
	}
	next();
});

setInterval(() => {
	Object.keys(cache_user)
	.filter(e => e.date < ( +new Date() - 1000 * 60 * 60 * 24))
	.forEach(e => delete cache_user[e]);

	Object.keys(cache_chat)
	.filter(e => e.date < ( +new Date() - 1000 * 60 * 60 * 24))
	.forEach(e => delete cache_chat[e])

}, 1000 * 60 * 60 * 5);

api.user_info = () => {
	return {
		user: cache_user,
		chat: cache_chat
	}
};