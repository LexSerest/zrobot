const {Markup, Extra} = require('telegraf');

class Feedback {
	constructor(){
		this.ignore = [];

		bot.on('text', (ctx, next) => {
			let reply_msg = ctx.message.reply_to_message;
			if(!this.ignore.includes(ctx.chat.id) &&
				ctx.chat.type == 'private' &&
				reply_msg &&
				reply_msg.from.username == api.username)
				this.sendAdmin(ctx);
			return next();
		});

		api.router.add("forward", ctx => {
			let userId = +ctx.command[0];
			let message_id = ctx.command[1];
			let type = ctx.command[2];

			if(!funcs.isAdminBot(ctx)) return;

			if(type){
				switch (type){
					case 'ig':
						let id = this.ignore.indexOf(userId);
						if(id == -1) {
							this.ignore.push(userId);
							ctx.answerCbQuery("mute");
						} else {
							this.ignore.splice(id, 1);
							ctx.answerCbQuery("unmute");
						}
					break;

					case 'o':
						ctx.telegram.onReply(ctx.from.id, "Enter your text.", ctx => {
							let txt = ctx.message.text;
							bot.telegram.sendMessage(userId, txt,
								Extra.markdown().inReplyTo(message_id), {parse_mode: 'Markdown'}, {})
						});
					break;

					case 'of':
						ctx.telegram.onReply(ctx.from.id, "Enter your text.", ctx => {
							let txt = ctx.message.text;
							bot.telegram.sendMessage(userId, txt, {parse_mode: 'Markdown'}, {})
						});
					break;
				}
			}
		})
	}

	sendAdmin(ctx){
		return; // _disabled
		let isForward = false;
		let userId = ctx.chat.id;

		let txt = '';
		if(ctx.chat.type != 'private') {
			txt += `chat: ${ctx.chat.title} ${ctx.chat.username ? '@' + ctx.chat.username : ''}\n`;
		}
		txt += `user: ${ctx.from.first_name} ${ctx.from.username ? '@'+ctx.from.username : ''}\n`;

		if(!ctx.message.text) isForward = true;
		else txt += ctx.message.text;

		let mark = Markup.inlineKeyboard([
				api.router.callbackButton("Ignore", 'forward', [userId, ctx.message.message_id, 'ig']),
				api.router.callbackButton("Reply", 'forward', [userId, ctx.message.message_id, 'o']),
				api.router.callbackButton("Only reply", 'forward', [userId, ctx.message.message_id, 'of']),
			],
			{columns: 3}
		);

		bot.telegram.sendMessage(api.config.forward, txt, mark.extra());
		if(isForward) {
			bot.telegram.forwardMessage(api.config.forward, userId, ctx.message.message_id);
		}

	}
}

new Feedback();
