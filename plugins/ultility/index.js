"use strict";

const qr = require('qr-image');

bot.cmd('base64', ({ text, reply, i18n }) => {
	if(!text) return reply(i18n.t('base64_text'));
	reply(new Buffer(text).toString('base64'))
});

bot.cmd('base64de', ({ from, text, reply, i18n}) => {
	if(!text) return reply(i18n.t('base64_text'));
	reply(from.first_name + ', base64 decode: ' + new Buffer(text, 'base64').toString('utf8'))
});

bot.cmd('qr', ({ text, replyWithPhoto, reply, i18n }) => {
	if(!text) return i18n.t('qr_text');
	if(text.length > 100) return reply('sorry... very long');
	let img = qr.image(text, {size: 10});
	replyWithPhoto({source: img})
});

bot.cmd('get', ctx => {
	let data = ctx.message;
	if(data.reply_to_message) data = data.reply_to_message;

	let msgId = data.message_id;
	let userId = data.from.id;
	let name = data.from.first_name + (data.from.last_name ? data.from.last_name : '');

	ctx.telegram.sendMessage(ctx.from.id,
		`Message ID: ${msgId}\n` +
		`User ID: ${userId}\n` +
		`Name: ${name}\n` +
		`Chat id: ${ctx.chat.id}\n` +
		`Chat name ${ctx.chat.title || ctx.chat.first_name}`
	);
});

bot.hears(/\/(s|r)\/(.+)\/(.+)\/?/, (ctx, next) => {
	if(!ctx.message ||
		!ctx.message.reply_to_message ||
		!ctx.message.reply_to_message.text) return ctx.reply(ctx.i18n.t('regexp_empty'));

	let simple = ctx.match[1] === 'r';
	let find = ctx.match[2];
	let replace = ctx.match[3];
	let r_text = ctx.message.reply_to_message.text;
	let reply = false;
	try {
		reply = r_text.replace(simple ? find : new RegExp(find, 'ig'), replace);
	} catch (e){
		reply = ctx.i18n.t('regexp_error');
	}

	if(reply) ctx.reply(reply);

	next()
});