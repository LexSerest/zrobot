"use strict";

const debug = {
	debug: require('debug')('bot:test'),
	locales: require('debug')('bot:test:locales')
};

require('../core/funcs');
const MongoClient = require('mongodb').MongoClient;
const plugins = require('../core/middlewares/plugins');

const config = require('../config.json');

global.isDebug = true;


class Api {
	constructor(){
		this.config = config;

		this.initApi();
		global.api = this;

	}

	db_save(){}
	db_data(...args){}

	async init(){
		let data = await MongoClient.connect(config.url_db);
		this.db = {
			users: data.collection("users"),
			datas: data.collection("data")
		}
	}

	initApi(){
		this.locales = { loadLocale: (l, data) => debug.locales(l) }
		this.router = {
			add: (...args) => {}
		}
	}
}

class Bot {
	constructor(){
		global.bot = this;
		this._data = {};
		this.chats = {};
		this.telegram = new Proxy({}, {
			get(t, p){ return (...args) => {} }
		});
	}

	_add(name, txt, func){
		if(!this._data[name]) this._data[name] = [];
		this._data[name].push({txt, func});
	}

	async run(name, ctx, cmd = false){
		let c = new Ctx(ctx);
		await c.init();
		this._data[name].forEach( e => {
			if(!cmd) {
				e.func(c, () => {});
			} else {
				if (cmd == e.txt) e.func(c, () => {})
			}
		})
	}

	on(txt, func){ this._add('on', txt, func) }
	hears(txt, func){ this._add('hears', txt, func) }
	command(txt, func){ this._add('command', txt, func) }
	use(txt, func){ this._add('use', txt, func) }

}

class Ctx {
	constructor(obj = { chat: {}, from: {}, message: {} }){
		this.db = {};
		Object.assign(this, obj);
		this.i18n = {
			locale: (t) => 'ru',
			t: (...agrs) => {}
		}
	}

	async init(){
		this.db = await api.db.users.find({id: this.chat.id || -1});
	}

	reply(txt, ...args){}
	answerCallbackQuery(txt, ...args){}
	editMessageText(txt, ...args){}
	replyWithHTML(txt, ...args){}
	replyWithMarkdown(txt, ...args){}
}

async function init() {
	try {
		if (!global.api) {
			new Api();
			await api.init();
			new Bot();
			plugins('../plugins/');
		}
	} catch (e){
		console.log(e)
	}
}

module.exports = init;
