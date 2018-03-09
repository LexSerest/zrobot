const gm = require('gm');
const request = require("request");
const {Markup} = require('telegraf');
const debug = require("debug")("core:plugins:channel");
const path = require("path");
const {Task, Base, Small, Cached, User} = require("../../core/spec");


class Channel {
	constructor(api) {
		this.api = api;
		this.init();

		this.api.channel = this;
		this.config = api.config.channel;

		this.db = api.db_channel["channel"];
		this.doc = api.db_channel["docSend"];

		this.block = new User(1000 * 60 * 5, 1000 * 60 * 2);

		this.txt = {
			"addInfo": "Send your channel username (example: @house_arts)",
			"addError": "Please, send channel username (example: @house_arts). Try again."
		};

		this.button = {
			"Add/update": ctx => {
				let userId = ctx.from.id;
				ctx.onReply(this.txt["addInfo"], ctx => {
					let channel = Channel.nTxt(ctx.message.text);

					if(channel[0] != "@") return ctx.reply(this.txt["addError"]);
					this.chanClear(channel);

					ctx.telegram.getChatAdministrators(channel).then(arr => {
						arr.forEach(e => this.chanAddAdmin(channel, e.user.id));
						ctx.reply("Admins update");
					}).catch(e => {
						let msg = e.description;
						msg = msg.replace("Bad Request: ", "");
						ctx.reply(msg);
					})
				});
			},
			"Enadled/disabled repost document": ctx => {
				let userId = ctx.from.id;

				let button = this.getButton(userId, "doc");
				if(!button) return;
				ctx.editMessageReplyMarkup(button);
			},
			"Clear bot on my channel": ctx => {
				let userId = ctx.from.id;

				let button = this.getButton(userId, "clear");
				if(!button) return;
				ctx.editMessageReplyMarkup(button);
			}
		};

		this.command = {
			"p": ctx => {
				let channel = ctx.command[1];
				let id = ctx.command[2];
				let uID = `${channel}:${id}`;

				if(this.block.isBlock(uID))
					return ctx.answerCbQuery("Double post. Lock 5 minutes.", undefined, true);

				this.block.block(uID);
				this.send(ctx, channel, id);
			},
			"clear": ctx => {
				let channel = ctx.command[1];
				this.chanClear(channel);
				ctx.answerCbQuery(channel + " clear");
				ctx.editMessageReplyMarkup(this.getButtonDef());
			},
			"close": ctx => {
				let id = ctx.command[1];
				if(id != -1) this.close(ctx, id);
				else ctx.editMessageReplyMarkup(this.getButtonDef());
			},
			"doc": ctx => {
				let channel = ctx.command[1];
				if(this.doc[channel]) {
					delete this.doc[channel];
					return ctx.answerCbQuery("Post document _disabled for " + channel);
				}

				ctx.onReply(this.txt["addInfo"] + " for document channel", ctx => {
					let channel_doc = Channel.nTxt(ctx.message.text);

					ctx.telegram.getChatAdministrators(channel)
					.then(e => {
						this.doc[channel] = channel_doc;
						ctx.reply("Post document enabled: " + channel + " and " + channel_doc)
					})
					.catch(e => {
						let msg = e.description;
						msg = msg.replace("Bad Request: ", "");
						ctx.reply(msg);
					})
				});

				ctx.editMessageReplyMarkup(this.getButtonDef());
			},
			"w": ctx => {
				let button = Object.keys(this.button)[ctx.command[1]];
				this.button[button](ctx);
			}
		}
	}

	static nTxt(txt) {
		return txt.trim().toLowerCase();
	}

	/**
	 * Для доступа из других плангинов. Выбор канала для постинга
	 * @param ctx
	 * @param id
	 * @param tags
	 */
	post(ctx, id, tags) {
		if(!this.getObj(id)) return ctx.answerCbQuery("Try again.");
		this.setTags(id, tags);
		ctx.editMessageReplyMarkup(this.getButton(ctx.from.id, "p", id));
	}

	getObj(id) {
		return this.api.kona.cache.get(id);
	}
	setTags(id, tags) {
		let obj = this.api.kona.cache.get(id);
		obj.find_tags = tags;
		this.api.kona.cache.set(id, obj);
	}

	/**
	 * создание markup
	 * @param channel
	 * @param pic_message_id
	 * @param extra
	 */
	setMark(channel, pic_message_id, extra = -1){
		if(pic_message_id == -1 || extra == -1) return;

		let url = "https://telegram.me";
		let doc_channel = this.doc[channel];

		if(doc_channel) {
			let url_doc = [url, doc_channel.replace("@", ""), extra].join("/");
			let url_pic = [url, channel.replace("@", ""), pic_message_id].join("/");

			this.api.bot.telegram.editMessageReplyMarkup(
				channel,
				pic_message_id,
				pic_message_id,
				Markup.inlineKeyboard([Markup.urlButton("Download", url_doc)])
			);

			this.api.bot.telegram.editMessageReplyMarkup(
				doc_channel,
				extra,
				extra,
				Markup.inlineKeyboard([Markup.urlButton("View", url_pic)])
			);
		} else {
			let url_load = `${url}/${this.api.username.replace("@", "")}?start=l${extra}`;
			this.api.bot.telegram.editMessageReplyMarkup(
				channel,
				pic_message_id,
				pic_message_id,
				Markup.inlineKeyboard([Markup.urlButton("Download", url_load)])
			);
		}
	}

	/**
	 * отправка в канал
	 * @param ctx
	 * @param channel
	 * @param id
	 */
	send(ctx, channel, id) {
		let obj = this.getObj(id);
		if(!obj) return;

		let name = ctx.chat.first_name;
		let url = obj.url;

		let photo_id = -1;
		let doc_id = -1;

		let f_e = (e, t) => {
			if(this.doc[channel]) {
				if(t) photo_id = e.message_id;
				else doc_id = e.message_id;
				this.setMark(channel, photo_id, doc_id);
			} else this.setMark(channel, e.message_id, id);
		};

		if(this.config.use_gm) {
			gm(request(url)).resize('1280', '1280').toBuffer('JPEG', (err, data) => {
				ctx.telegram.sendPhoto(channel, {source: data}).then(e => f_e(e, 1))
			});
		} else {
			ctx.telegram.sendPhoto(channel, {url}).then(e => f_e(e, 1))
		}

		if(this.doc[channel]) {
			ctx.telegram.sendDocument(
				this.doc[channel],
				{url, filename: "f" + id + path.extname(url)},
				{caption: "Upload: " + name}
			).then(e => f_e(e, 0));
		}

		this.close(ctx, id);
		ctx.answerCbQuery("Please wait. Send to " + channel);
	}

	/**
	 * закрытие меню отправки
	 * @param ctx
	 * @param id
	 */
	close(ctx, id) {
		let obj = this.getObj(id);
		let find_tags = (obj && obj.find_tags) || "";
		let mark = this.api.kona.markCreate(ctx, id, find_tags, true);
		ctx.editMessageReplyMarkup(mark);
	}

	/**
	 * удаление канала из базы
	 * @param channel
	 */
	chanClear(channel) {
		Object.keys(this.db).forEach(e => {
			let id = this.db[e].indexOf(channel);
			if(id != -1) this.db[e].splice(id, 1);
			if(!this.db[e].length) delete this.db[e];
		});
	}

	chanAddAdmin(channel, userId) {
		userId = userId + "";
		if(!this.db[userId]) this.db[userId] = [];
		if(this.db[userId].indexOf(channel) == -1) this.db[userId].push(channel);
	}
	getChannel(userId) {
		userId = userId + "";
		return this.db[userId];
	}
	getButton(userId, command, id = -1) {
		let channels = this.getChannel(userId);

		if(!channels || !channels.length) return;

		channels = channels.map(e =>
			Markup.callbackButton(e, `channel:${command}:${e}:${id}`)
		);

		channels.push(Markup.callbackButton("Close", `channel:close:${id}`));
		return Markup.inlineKeyboard(channels, {columns: 1});
	}
	isAdmin(id) {
		return this.db[id + ""] != undefined;
	}

	getButtonDef(cmd = "w"){
		let button = Object.keys(this.button).map((e, i) =>
			Markup.callbackButton(e, `channel:${cmd}:${i}`)
		);

		return Markup.inlineKeyboard(button, {columns: 1});
	}

	init() {
		if(!this.api.db_channel["channel"]) this.api.db_channel["channel"] = {};
		if(!this.api.db_channel["docSend"]) this.api.db_channel["docSend"] = {};
		if(!this.api.db_channel["channel_command"])
			this.api.db_channel["channel_command"] = this.api.db_channel["admin"];

		this.api.bot.command("channel", ctx => {
			let userId = ctx.from.id;
			let db_prem = this.api.db["channel_command"];

			if(ctx.chat.type != "private") return;
			if(db_prem.indexOf(userId) == -1)
				return ctx.reply("You do not have permission. Info - /feedback");

			ctx.reply("Choose command", this.getButtonDef().extra())
		});

		this.api.bot.queryRouter.on("channel", ctx => {
			if(this.command[ctx.command[0]])
				return this.command[ctx.command[0]](ctx);
		})
	}
}

module.exports = {
	name: "Images search",
	version: "0.0.0",
	author: "LexSerest",
	description: "постинг в каналы",
	init: (api) => new Channel(api)
};


//
//class aChannel {
//	constructor(core) {
//		core.channel = this;
//		this.core = core;
//
//		this.url = [];
//		this.db = core.db["channel"];
//		this.dbHide = core.db["show"];
//		this.post = {};
//		this.event();
//
//		setInterval(()=> {
//			if(this.url.length > 100) this.url.splice(0, this.url.length - 100);
//		}, 1000 * 60 * 60)
//	}
//
//	isAdmin(id) {
//		return this.db[id] != undefined;
//	}
//
//	event() {
//		let command = {
//			"Add/update channel": ctx => {
//				ctx.onReply("Send your channel username (example: @house_arts)", ctx => {
//					let channel = ctx.message.text.trim().toLowerCase();
//					if(channel[0] != "@") return ctx.reply("Please, send channel username (example: @house_arts). Try again.");
//
//					Object.keys(this.db).forEach(e => {
//						let id = this.db[e].indexOf(channel);
//						if(id != -1) this.db[e].splice(id, 1);
//						if(!this.db[e].length) delete this.db[e];
//					});
//
//					ctx.telegram.getChatAdministrators(channel).then(arr => {
//						arr.forEach(e => {
//							let id = e.user.id + "";
//							if(!this.db[id]) this.db[id] = [];
//							if(this.db[id].indexOf(channel) == -1) this.db[id].push(channel);
//						});
//						ctx.reply("Admins update");
//					}).catch(e => {
//						let msg = e.description;
//						msg = msg.replace("Bad Request: ", "");
//						ctx.reply(msg);
//					})
//				})
//			},
//			'Show "Full" button': ctx => {
//			},
//			"Delete my channel in bot": ctx => {
//				ctx.onReply("Send your channel username (example: @house_arts)", ctx => {
//					let channel = ctx.message.text.trim().toLowerCase();
//					if(channel[0] != "@") return ctx.reply("Please, send channel username (example: @house_arts). Try again.");
//
//					let id = (ctx.callbackQuery && ctx.callbackQuery.from.id) || ctx.from.id;
//
//					Object.keys(this.db).forEach(e => {
//						let id = this.db[e].indexOf(channel);
//						if(id != -1) this.db[e].splice(id, 1);
//						if(!this.db[e].length) delete this.db[e];
//					});
//
//					ctx.reply("Channel delete");
//				})
//			}
//		};
//		let hideCommand = {
//			"a": ctx => {
//				let channel = ctx.command[2];
//				let url = this.url[ctx.command[1]];
//				let user = ctx.from.first_name;
//
//				debug("post", channel, url);
//				if(!url) {
//					ctx.editMessageReplyMarkup();
//					ctx.answerCbQuery("Try again.");
//					return;
//				}
//
//				let button = [];
//
//				let isAddFull = this.dbHide.indexOf(channel) != -1;
//
//				// лайки
//				// if(this.dbLike.indexOf(channel) != -1) button.push(Markup.callbackButton(
//				// 	this.core.config.like_symbol + "0", "like:0:" + (isAddFull ? "1" : "0")
//				// ));
//
//				if(isAddFull) button.push(Markup.urlButton("Full", url + "?" + encodeURIComponent(user)));
//
//				let mark = Markup.inlineKeyboard(button, {columns: 1}).extra();
//
//				if(!this.post[channel]) this.post[channel] = [];
//
//				if(this.post[channel].indexOf(url) != -1)
//					return ctx.answerCbQuery("NOT SEND. Double send in " + channel);
//
//				let id = this.post[channel].push(url) - 1;
//
//				if(this.core.config.channel.use_gm)
//					gm(request(url))
//					.resize('1280', '1280')
//					.toBuffer('JPEG', (err, data) => {
//						ctx.telegram.sendPhoto(channel, {source: data}, mark).then(e=> {
//							this.post[channel].splice(id, 1);
//						})
//					});
//				else ctx.telegram.sendPhoto(channel, {url}, mark).then(e=> {
//					this.post[channel].splice(id, 1);
//				});
//
//				ctx.answerCbQuery("Send in " + channel);
//
//			},
//			"c": ctx => {
//				let json = ctx.command[1];
//				if(json == "0") return ctx.editMessageReplyMarkup();
//
//				let obj = this.core.kona.getObj(JSON.parse(json));
//				if(!obj) return ctx.editMessageReplyMarkup();
//				let url = obj.url;
//				ctx.editMessageReplyMarkup(
//					Markup.inlineKeyboard([
//						Markup.callbackButton("Post", "k:p:" + json),
//						Markup.urlButton("Full", url),
//						Markup.callbackButton("Tags", "k:t:" + json),
//						Markup.callbackButton("More", "k:m:" + json),
//					], {
//						wrap: (b, i, cur)=> {
//							return (i == 1) && (cur[0].text == "Post");
//						}
//					}))
//			},
//			"clear": ctx => {
//				this.db[ctx.callbackQuery.from.id] = [];
//				ctx.answerCbQuery("Clear");
//			},
//			"button": ctx => {
//				let id = this.dbHide.indexOf(ctx.command[2]);
//				let txt = "hide";
//				if(id != -1) this.dbHide.splice(id, 1);
//				if(id == -1) {
//					this.dbHide.push(ctx.command[2]);
//					txt = "show";
//				}
//				ctx.answerCbQuery("Button " + txt + " in " + ctx.command[2]);
//			}
//		};
//
//		let markup = Markup.inlineKeyboard(
//			Object.keys(command).map(e => Markup.callbackButton(e, "channel:" + e))
//		);
//
//		this.core.bot.command("channel", ctx => {
//			if(ctx.chat.type != "private") return;
//			ctx.reply("Use button", markup.extra());
//		});
//		this.core.bot.hears(/https?:\/\/\S+.(png|jpg|jpeg|bmp|tif)$/, ctx => {
//			if(ctx.chat.type != "private") return;
//			let id_url = this.url.push(ctx.message.text) - 1;
//			let id = (ctx.callbackQuery && ctx.callbackQuery.from.id) || ctx.from.id;
//			let channels = this.db[id + ""];
//			if(!channels) return;
//
//			let markup = this.button(channels, id_url).forceReply();
//			ctx.reply("Select channel", markup.extra());
//		});
//		this.core.bot.queryRouter.on("channel", ctx => {
//			let date = Math.round((+new Date()) / 1000) - 60 * 60 * 24;
//			if(date > ctx.callbackQuery.message.date) return;
//			if(hideCommand[ctx.command[0]]) return hideCommand[ctx.command[0]](ctx);
//			if(command[ctx.command[0]]) return command[ctx.command[0]](ctx);
//		})
//	}
//
//	button(channels, url, json = "0", f = "a") {
//		channels = channels.map(e => Markup.callbackButton(e, `channel:${f}:${url}:${e}:${json}`));
//		channels.push(Markup.callbackButton("Close", `channel:c:${json}`));
//		return Markup.inlineKeyboard(channels, {columns: 1});
//	}
//
//	post(ctx, url, json_dana) {
//		debug(url);
//		let id_url = this.url.push(url) - 1;
//		let id = (ctx.callbackQuery && ctx.callbackQuery.from.id) || ctx.from.id;
//		let channels = this.db[id + ""];
//		if(!channels) return;
//
//		let markup = this.button(channels, id_url, json_dana);
//		ctx.editMessageReplyMarkup(markup);
//	}
//}
