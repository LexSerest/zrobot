const { Markup } = require('telegraf');

class Setting{
	constructor(api){
		this.api = api;
		this.db = api.db_kona;
		this.event();

		this.button = {
			"Search only SFW content (on/off)": ctx => {
				let id = ctx.command[1] + "";

				if(!this.db[id]) this.db[id] = "";
				if(this.db[id].indexOf("rating:s") != -1) {
					this.db[id] = this.db[id].replace(/ ?rating:s ?/i, ' ').trim();
					ctx.answerCbQuery("Only SFW content _disabled");
				} else {
					this.db[id] = (this.db[id] + ' rating:s').trim();
					ctx.answerCbQuery("Only SFW content enabled");
				}
			},

			"Added in search": ctx_on => {
				let id = ctx_on.command[1] + "";
				ctx_on.onReply("Send me tags, for added in search result", ctx => {
					this.db[id] = ctx.message.text;
					ctx_on.answerCbQuery(`Save. Currect: ${this.db[id] || "Empty"}`, undefined, true);
				})
			},

			"Setting clear": ctx => {
				let id = ctx.command[1] + "";
				delete this.db[id];
				ctx.answerCbQuery(`Save. Currect: ${this.db[id] || "Empty"}`, undefined, true);
			}
		};
	}

	reply(ctx){
		let userId = ctx.from.id;
		let chatId = ctx.chat.id + "";
		let text = "you";

		if(ctx.chat.type != "private") text = ctx.chat.title;

		text = `Settings for ${text}\nCurrect: ${this.db[chatId] || "Empty"}`;

		let mark = Markup.inlineKeyboard(Object.keys(this.button).map(
			(e, i) => Markup.callbackButton(e, `setting:${i}:${chatId}`)),
			{columns: 1}
		);

		ctx.telegram.sendMessage(userId, text, mark.extra());
	}

	event(){
		this.api.bot.hears(/^\/settings?$/, ctx=>{
			let idChat = ctx.chat.id;

			if(ctx.chat.type != "private") {
				ctx.getChatAdministrators(idChat).then(arr => {
					arr.forEach(e => {
						if(e.status == "creator") this.reply(ctx);
					});
				});
				return;
			}

			this.reply(ctx, ctx.from.id, idChat)
		});

		this.api.bot.queryRouter.on("setting", ctx => {
			if(ctx.command.length < 2) return;
			let name = Object.keys(this.button)[ctx.command[0]];
			this.button[name](ctx);
		})
	}
}


module.exports = {
	name: "kona setting",
	version: "0.0.0",
	author: "LexSerest",
	description: "эксперементальный плангин для настойки плангина kona",
	init: (api) => {new Setting(api)}
};

