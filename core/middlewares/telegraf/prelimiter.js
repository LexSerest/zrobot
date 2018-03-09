"use strict";

const debug = require('debug')('bot:middlewares:prelimit');

let users = {};

bot.use((ctx, next) => {
	if(!ctx || !ctx.from || !ctx.from.id) return;
	let key = ctx.from.id;
	if(users[key] && (users[key] > +new Date() - 100) ) return debug(key);
	users[key] = +new Date();
	next();
});