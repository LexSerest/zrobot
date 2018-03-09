'use strict';

const debug = require('debug')('bot:plugins:kona');
const util = require('util');
const gm = require('gm');
const fs = require('fs');
const querystring = require("querystring");
const {Markup} = require('telegraf');
const path = require("path");
const request = require('request');

const {Task, Base, Small, Cached, User} = require("../../core/spec");


const random = (obj)=> {
	if(Array.isArray(obj)) return obj[Math.round(Math.random() * (obj.length - 1))];
	if(typeof obj == 'number') return Math.round(Math.random() * obj);
};

class Images {
	constructor() {
		api.kona = this;
		this.config = api.config.kona;
		this.base = new Base();
		this.tags = new Small();
		this.cache = new Cached(60, 100);
		this.user = new User();
		this.bigBlock = new User(1000 * 60 * 5, 1000 * 60 * 5);
		this.sLoad = new Task(1200);
		this.isSafe = false;

		this.changeDomain();

		this.defaultTags = [
			'rating:safe', "armor rating:safe", "loli rating:safe"
		];

		this.init();
	}


	changeDomain(safe = undefined){
		this.isSafe = (safe !== undefined ? safe : !this.isSafe);
		let domain = (this.isSafe ? 'http://konachan.net' :'https://konachan.com');
		this.board = `${domain}/post.json?`;
		return this.isSafe;
	}

	static findId(text){
		let m = text.match(/(?: |^)(id:\d+)(?: |$)/i);
		return (m ? m[1] : text);
	}
	static alert(ctx){
		if(ctx.chat.type != "private")
			ctx.answerCbQuery("Send in PM. If don't come, then add to the robot yourself.", undefined, true);
	};
	static error(ctx){
		ctx.answerCbQuery("Error :(", undefined, true);
	};
	static block(ctx){
		let txt = "You already have the full version. Wait 5 minutes.";
		if(ctx.answerCbQuery) ctx.answerCbQuery(txt, undefined, true);
		else ctx.reply(txt);
	};

	eParse(json, isArray = true, num = 0){
		if(isArray && !json.length) return;
		if(isArray) json = json[num];

		let id = json.id;
		let tags = json.tags;
		let url = json.jpeg_url || json.file_url || json.path;
		let size = json.file_size;

		if(url.startsWith('//')) url = (this.isSafe ? 'http:' : 'https:') + url;
		//url = `https://${json.server}.ibsearch.xxx/${url}`;

		if(!id) return;

		this.cache.set(id, {url, tags, size});
		return {id, tags, url, size};
	}

	/**
	 * Разбор данных и добавление в базу
	 * @param tags
	 * @param json
	 */
	parse(tags, json) {
		json.forEach(e => {
			let obj = this.eParse(e, false);
			if(obj) this.base.add(tags, { url: obj.url, id: obj.id, size: obj.size });
		});

		debug("name: " + tags, "count: " + this.base.length(tags), "json data", json.length);
	};

	/**
	 * Загрузка данных
	 * @param tags
	 * @param param
	 * @returns {Promise}
	 */
	load(tags, param = {}) {

		param.tags = "order:random " + tags;

		if(!param.limit) param.limit = this.config.limit;
		let url = this.board + "&" + querystring.stringify(param);
		debug('url load', url);
		return new Promise((resolve, reject) => {
			request({url, timeout: 1500}, (error, res, body) => {
				if(error && ((error.code == 'ETIMEDOUT') || (error.code == 'ESOCKETTIMEDOUT'))) return reject("Sorry... Image server is down :(");
				if(error ||
					(res.statusCode != 200) ||
					(body.indexOf('[') != 0)) {
					return reject("Error load :(");
				}

				let json = JSON.parse(body);
				if(!json || !json.length) return reject("This tag doesn't exist.");
				resolve(json);
			})

		})
	}

	/* "Медленная" загрузка */
	slowGet(tags, callback, limit = 1) {
		this.sLoad.add(() =>
			this.load(tags, {limit})
			.then(json => {
				callback(json)
			})
			.catch(e => {
				callback({error: true, msg: e});
				debug("slowGet", e)
			})
		);
	}
	slowParse(tags, callback) {
		let ftags = tags;
		if(tags.indexOf('order:random') === -1) ftags = tags + ' order:random';
		this.slowGet(ftags, (json)=> {
			if((typeof json == 'object') && json.error) return callback(json.msg);
			this.parse(tags, json);
			callback();
		}, this.config.limit)
	}

	markCreate(ctx, id, tag, isPhoto){
		let type = (ctx.callbackQuery && ctx.callbackQuery.message.chat.type) || ctx.chat.type;
		let userId = ctx.from.id;
		let button = [
			api.router.callbackButton("Tags", 'k', ['t', id]),
			api.router.callbackButton("More", 'k', ['m', tag])
		];

		if(isPhoto) button.unshift(api.router.callbackButton("Get", 'k', ['g', id]));
		return Markup.inlineKeyboard(button, {
			wrap: (b, i, cur)=> {
				return (i == 1) && (cur[0].text == "Post");
			}
		});
	}

	/**
	 * отправка пользователю
	 * @param ctx
	 * @param tag
	 * @param isChat
	 * @param isEmpty
	 */
	reply(ctx, tag, isChat, isEmpty = false) {
		if(typeof(tag) == "string") tag = tag.replace(/\s\s+/g, ' ').toLowerCase().trim();
		tag = this.tags.get(tag);
		tag = Images.findId(tag);

		debug("tag", tag);
		let userId = isChat ? ctx.chat.id : ctx.from.id;
		let obj = this.base.get(tag);

		if(!obj) {
			this.find(ctx, tag, isChat);
			return;
		}

		let id = obj.id;
		let url = obj.url;
		let size = obj.size;
		let isPhoto = /\.(png|jpg|jpeg|bmp|tif)$/i.test(url);



		if(isEmpty) tag = "";
		let mark = this.markCreate(ctx, id, this.tags.test(tag), isPhoto).extra();
		debug("reply", tag, obj, mark);

		if(isPhoto) {
			let send = (data) => {
				ctx.telegram.sendPhoto(userId, {source: data}, mark)
				.catch(e => debug(e.message))
			};

			if(size < 4000000) {
				ctx.telegram.sendPhoto(userId, url, mark).catch(e => {
					if(e.description.indexOf("get HTTP") == -1) return;
					send(request(url));
				}).catch(e => debug(e.message));
			} else {
				ctx.telegram.sendMessage(userId, "Please wait...");
				if(this.config.use_gm) {
					gm(request(url)).resize('1200', '1200').toBuffer('JPEG', (err, data) => send(data))
				} else send(request(url));

			}
		} else {
			if(size < 4000000) ctx.telegram.sendDocument(userId, url, mark)
			.catch( e => {
				if(e.description.indexOf("get HTTP") == -1) return;
				ctx.telegram.sendDocument(userId, {
					source: request(url),
					filename: "doc" + path.extname(url)
				}, mark).catch(e => debug(e.message))

			});
			else {
				if(this.config.isLoadBigGif) {
					ctx.telegram.sendMessage(userId, "Please wait...");
					ctx.telegram.sendDocument(userId, {
						source: request(url),
						filename: "doc" + path.extname(url)
					}, mark).catch(e => debug(e.message))

				} else ctx.telegram.sendMessage(userId, "Sorry :(");//this.reply(ctx, tag, isChat)
			}
		}
	}

	/**
	 * Поиск
	 * @param ctx
	 * @param tag
	 * @param isChat
	 */
	find(ctx, tag, isChat) {
		let id = ctx.chat.id;
		let isEmpty = false;

		tag = this.tags.get(tag);

		if(!tag) {
			tag = random(this.defaultTags);
			isEmpty = true;
		}

		// if(core.db_kona[id + ""] &&
		// 	tag.indexOf(core.db_kona[id + ""]) == -1)
		// 	tag = [tag, core.db_kona[id + ""]].join(' ');

		//if(tag[0] == "-") return ctx.reply("Sorry:("); // баг на сервере // TODO: проверить еще раз

		tag = tag.replace(/\s\s+/g, ' ').toLowerCase().trim();

		if(this.base.length(tag)) {
			this.reply(ctx, tag, isChat);
			return;
		}

		debug("Search.");

		this.slowParse((tag).replace(/\*\*/g, ":"), (error_msg)=> {
			if(error_msg) return ctx.reply(error_msg);
			if(this.base.length(tag)) this.reply(ctx, tag, isChat, isEmpty);
			else ctx.reply("This tag doesn't exist.");
		})

	};

	/**
	 * события для кнопок
	 * @param cmd
	 * @param data
	 * @param ctx
	 * @returns {*}
	 */
	command(ctx, cmd, data) {
		debug("command", cmd, data);
		let userId = ctx.from.id;

		let list = {
			// get full
			g: ctx => {
				let uID = userId + ":" + data;
				if(this.bigBlock.isBlock(uID))
					return Images.block(ctx);
				this.bigBlock.block(uID);

				Images.alert(ctx);
				let cache = this.cache.get(data);
				if(cache) {
					let url = cache.url;
					let filename = "f" + data + path.extname(url);
					let size = cache.size;

					if(size>1000000) ctx.telegram.sendMessage(userId, "Please wait...");

					ctx.telegram.sendDocument(userId, {url, filename})
					.catch(e => this.bigBlock.unBlock(uID));
				} else {
					this.slowGet("id:" + data, (e) => {
						let obj = this.eParse(e);
						if(!obj) return Images.error(ctx);
						if(obj.size>1000000) ctx.telegram.sendMessage(userId, "Please wait...");
						ctx.telegram.sendDocument(userId, {
							url: obj.url,
							filename:"f" + data + path.extname(obj.url)
						}).catch(e => this.bigBlock.unBlock(uID));
					})

				}
			},

			// get tags
			t: ctx => {
				this.user.block(userId);
				Images.alert(ctx);
				let cache = this.cache.get(data);
				if(cache) ctx.telegram.sendMessage(userId, `id:${data} ${cache.tags}`);
				else {
					this.slowGet("id:" + data, (e) => {
						let obj = this.eParse(e);
						if(!obj) return Images.error(ctx);
						ctx.telegram.sendMessage(userId, `id:${obj.id} ${obj.tags}`).catch(e => {});
					})
				}
			},

			// more
			m: ctx => {
				this.user.block(userId);
				Images.alert(ctx);
				let tag = this.tags.get(data).replace(/\*\*/g, ":");
				this.reply(ctx, tag, false);
			}
		};
		if(list[cmd]) list[cmd](ctx);
	}

	/**
	 * инициализация событий
	 */
	initEvent() {

		const regex = cmd => new RegExp(`^\\/?${cmd}(?:@${api.username})?(?:$| (.*))`, 'i');

		bot.hears(regex('(s)?(pic)'), (ctx, next) => {
			let userId = ctx.from.id;
			if(this.user.isBlock(userId)) {
				ctx.reply("Too many requests.");
				return;
			}
			this.user.block(userId);

			const isSafe = ctx.match[1];
			let tag = ctx.match[3] || '';

			if(isSafe) tag = `rating:safe ${tag}`;
			this.reply(ctx, tag.trim(), true);
			next();
		});

		bot.hears(/\/start l(\d+)$/, ctx => {
			let id = ctx.match[1] || '';
			this.command(ctx, "g", id);
		});

		bot.hears(/\/start i(\d+)$/, ctx => {
			let id = ctx.match[1] || '';
			this.reply(ctx, "id:"+ id, true);
		});

		api.router.add("k", ctx => {
			let cmd = ctx.command;
			this.command(ctx, cmd[0], cmd[1]);
		})
	}

	init() {
		this.initEvent();
	}
}

new Images();
