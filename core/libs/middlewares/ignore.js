"use strict";

const debug = require('debug')('bot:middlewares:libs');
const { Extra } = require('telegraf');
const ignore = require('../funcs').ignore;

module.exports = () => {
	return (ctx, next) => {
		let text = ctx.message ? ctx.message.text : false;
		if(ignore(text)) return debug('ignore');
		return next();
	}
};