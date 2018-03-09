"use strict";

const { Telegram } = require('telegraf');
const debug = require('debug')('bot:limiter');
const logger = require("mag")('bot:limiter-callapi');

const callApi = Telegram.prototype.callApi;
let limiter = {};


Telegram.prototype.callApi = function(func, ...args){
	if(args && args[0] && args[0].chat_id && (/*func.startsWith('send') || */func.startsWith('edit'))) {
		if(limiter[args[0].chat_id] && limiter[args[0].chat_id] > +new Date() - 700) {
			logger.info('stop', func, args[0].chat_id);
			return Promise.resolve();
		}
		limiter[args[0].chat_id] = +new Date();
	}

	return callApi.call(this, func, ...args)
	.catch(e => {
		logger.warn(func, e.message, args && args[0] && args[0].chat_id ? args[0].chat_id : '');
		if(![403].includes(e.code)) throw e;
	});
};