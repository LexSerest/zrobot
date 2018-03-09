"use strict";

const { Extra } = require('telegraf');
const debug = require('debug')('bot:plugins:speak');
const config = api.config.speak;
const frequency = Math.round((1 / config.frequency) * 100) - 1;
const frequency_save = Math.round((1 / config.frequency_save) * 100) - 1;

const rand = libs.funcs.rand;
const onlyAdmin = libs.middlewares.onlyAdmin(true);
const ignore = libs.middlewares.ignore(true);

const replace = require('./libs/replace');
const add = require('./libs/add');


bot.cmd('speak', onlyAdmin, ctx => {
	let db = ctx.dbChat();
	db.isSpeak = !(db.isSpeak);

	let text = ctx.isPrivate ? ctx.i18n.t('speak_private') : ctx.i18n.t('speak_' + (db.isSpeak ? 'on' : 'off'));
	ctx.reply(text);
});

bot.on('text', async (ctx, next) => {
	let text = ctx.message.text;
	if(!text || /^(s?pic|s?gif|\/|!|~)/.test(text)) return next();

	if(text.length > 100) return next();

	let reply_msg = ctx.message.reply_to_message;
	let reply_text = reply_msg ? reply_msg.text : false;

	if(text && /(@[a-z]+)|https?:\/\/|\.(ru|org|net|com)/i.test(text)) return next();



	let speak_data = false;
	let reply = false;

	let isReply = ctx.isPrivate;
	if(!ctx.isPrivate && ctx.db.chat.isSpeak) {
		//if(/(^| )(bot|бот)( |$)/gui.test(text)) isReply = true;
		if(reply_msg && reply_msg.from.id === bot.id) isReply = true;
		if(!reply_msg && rand(frequency, true)) isReply = true;
 	}

 	if(isReply){
	    let r_text = replace(text);
	    speak_data = await api.db.speaks.findOne({text: r_text}) || { reply: [] };
	    reply = speak_data.reply;
	    if(!reply || !reply.length) isReply = false;
    }

    if(!reply) isReply = false;

 	let isSave = true;
	if(reply_msg && reply_msg.text && rand(frequency_save, true)){
		if(reply_msg.from.id === ctx.from.id) isSave = false;
		if(reply_msg.from.id === bot.id) isSave = false;
		if(/(@[a-z]+)|https?:\/\/|\.(ru|org|net|com)/i.test(reply_text)) isSave = false;
		if(reply_msg.text.length > 100) isSave = false;

	} else {
		isSave = false;
	}

	if(reply_text && text.endsWith('**')){
		isSave = true;
		text = text.slice(0, -2);
	}


	if(isReply){
		let r_data = rand(reply);
		if(r_data) ctx.reply(r_data).catch(e => {});
	}

	if(isSave){
		let reply_r_text = replace(reply_text);
		if(reply_r_text && text) {
			let speak_data_save = await api.db.speaks.findOne({text: reply_r_text}) || {text: reply_r_text, reply: []};
			add(speak_data_save.reply, text, config.max_option);
			await api.db.speaks.update({text: reply_r_text}, speak_data_save, {upsert: true});
		}
	}

	return next();
});

