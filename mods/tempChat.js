"use strict";

let tempChat = api.tempChat = {};
let tempUser = api.tempUser = {};

bot.on('text', (ctx, next) => {
	if(ctx.isPrivate) return next();

	let uid = `${ctx.from.id}`;
	let cid = `${ctx.chat.id}`;
	let update = +new Date();

	tempChat[cid] = {
		title: ctx.chat.title,
		username: ctx.chat.username,
		update
	};

	if(!tempUser[cid]) tempUser[cid] = {};
	tempUser[cid].update = update;
	tempUser[cid][uid] = {
		first_name: ctx.from.first_name,
		username: ctx.from.username,
		update
	};

	next();
});

setInterval(() => {
	Object.keys(tempChat).forEach(cid => {
		if(tempChat[cid].update < (+new Date() - 1000 * 60 * 60 * 2)) {
			delete tempChat[cid];
			delete tempUser[cid];
		}
	})
}, 1000 * 60 * 60);