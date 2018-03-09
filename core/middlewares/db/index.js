"use strict";

require('./init');

const debug = require('debug')('bot:middlewares:db');
const logger = require("mag")('bot:middlewares:db');
const interval_save = 1000 * 60 * 10; // 10 мин

let cache_user = api.cache_user = {};
let cache_chat = api.cache_chat = {};

api.db_save = async () => {
	let promise_user = [];
	let promise_chat = [];

	Object.keys(cache_user).forEach(e => {
		let data = cache_user[e];
		promise_user.push(api.db.users.update(
			{id: data.id, chatId: data.chatId},
			data,
			{upsert: true}
		));
	});

	Object.keys(cache_chat).forEach(e => {
		let data = cache_chat[e];
		promise_chat.push(api.db.chats.update(
			{id: data.id},
			data,
			{upsert: true}
		));
	});

	let time = +new Date();
	await Promise.all(promise_user).catch( e => logger.warn('db_save user', e));
	await Promise.all(promise_chat).catch( e => logger.warn('db_save chat', e));

	return (+new Date()) - time;
};
api.db_used = () => {
	return {
		chat: Object.keys(cache_chat).length,
		user: Object.keys(cache_user).length
	}
};

bot.use((ctx, next) => {
	ctx.dbUser = async () => {
		let uid = ctx.from.id;
		let cid = ctx.chat.id;
		let ucid = `${uid}:${cid}`;

		if (cache_user[ucid]){
			debug('dbUser cache', ucid);
			return cache_user[ucid];
		}

		try {
			cache_user[ucid] = (await api.db.users.findOne({
				id: uid,
				chatId: cid
			})) || Object.assign({}, Object.assign({chatId: cid}, ctx.from));
		} catch (e){
			logger.warn('dbUser.get', ucid, e);
			cache_user[ucid] = Object.assign({}, Object.assign({chatId: cid}, ctx.from));
		}

		debug('getUser', ucid);
		setInterval(async () => {
			let data = cache_user[ucid];
			await api.db.users.update(
				{id: data.id, chatId: data.chatId},
				data,
				{upsert: true}
			);
			delete cache_user[ucid];
			debug('dbUser save', ucid);
		}, interval_save);

		return cache_user[ucid];
	};

	ctx.dbReplyUser = async () => {
		if(!ctx.message || !ctx.message.reply_to_message) return;

		const reply_msg = ctx.message.reply_to_message;
		let cid = ctx.chat.id;
		let uid = reply_msg.from.id;
		let ucid = `${uid}:${cid}`;

		if (cache_user[ucid]){
			debug('dbReplyUser cache', ucid);
			return cache_user[ucid];
		}

		try {
			cache_user[ucid] = (await api.db.users.findOne({
				id: uid,
				chatId: cid
			})) || Object.assign({}, Object.assign({chatId: cid}, reply_msg.from));
		} catch (e){
			logger.warn('dbReplyUser.get', ucid, e);
			cache_user[ucid] = Object.assign({}, Object.assign({chatId: cid}, reply_msg.from));
		}

		debug('dbReplyUser', ucid);
		setTimeout(async () => {
			let data = cache_user[ucid];
			if(!data) return;
			await api.db.users.update(
				{id: data.id, chatId: data.chatId},
				data,
				{upsert: true}
			);
			delete cache_user[ucid];
			debug('getReplyUser save', ucid);
		}, interval_save);

		return cache_user[ucid];
	};

	ctx.dbChat = async () => {
		let uid = ctx.from.id;
		let cid = ctx.chat.id;
		let ucid = `${cid}`;

		if (cache_chat[ucid]){
			debug('dbChat cache', ucid);
			return cache_chat[ucid];
		}

		try {
			cache_chat[ucid] = (await api.db.chats.findOne({id: ctx.chat.id})) || Object.assign({}, ctx.chat);
		} catch (e){
			logger.warn('dbChat.get', ucid, e);
			cache_user[ucid] = Object.assign({}, ctx.chat);
		}

		debug('dbChat', ucid);
		setTimeout(async () => {
			let data = cache_chat[ucid];
			if(!data) return;
			await api.db.chats.update(
				{id: data.id},
				data,
				{upsert: true}
			);
			delete cache_chat[ucid];
			debug('dbChat save', ucid);
		}, interval_save);

		return cache_chat[ucid];
	};

	next()
});