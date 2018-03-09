"use strict";

const debug = require('debug')('bot:middlewares:libs');
module.exports = () => {
	return ({ message }, next) => {
		if(message.from.id === api.config.admin_id) return next();
		debug('only admin bot');
	};
};