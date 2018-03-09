"use strict";

const { Markup, Extra } = require('telegraf');
const dot = require('dot-object');
const debug = require('debug')('bot:libs:menu');

global.Menu = class {
	constructor(name, menu, {columns = 3, i18n = false, hide} = {}, data = {}){
		this.name = name;
		this.menu = menu;
		this.hide = hide;
		this.data = data;
		this._menu = {};
		this.setting = { columns, i18n };
		this.generate();
		this.pathSave = {};

		this.prev = {};
		this.limit = {};
		api.router.add('m_' + name, ctx => this.run(ctx));
	}

	md5(txt) {
		return require('crypto').createHash('md5').update(txt).digest("hex").substr(0, 14);
	}

	generate(){
		Object.keys(dot.dot(this.menu)).forEach(e => {
			this._menu[this.md5(e)] = e;
			let match = e.match(/(^.+)\./);
			if(!match) return;
			this._menu[this.md5(match[1])] = match[1];
		})
	}

	run(ctx){
		if(this.limit[ctx.chat.id]) return debug('ignore event');
		setTimeout(() => this.limit[ctx.chat.id] = false, 1000);


		let md5 = this.limit[ctx.chat.id] = ctx.command[0];
		let opt = ctx.command[1] || '';
		let cmd = this._menu[md5];
		if(!cmd) return;
		let data = dot.pick(cmd, this.menu);
		let mark = this.gen(ctx, md5);

		if(typeof(data) === 'object') ctx.editMessageReplyMarkup(mark);
		if(typeof(data) === 'function') {
			let match = cmd.match(/(^.+)\./);
			ctx.menu_mark = this.gen(ctx, match ? this.md5(match[1]) : false, false, opt);
			data(ctx);
		}

		if(data === 'prev') {
			let match = cmd.match(/(^.+)\..+\./);
			ctx.editMessageReplyMarkup(this.gen(ctx, match ? this.md5(match[1]) : false, false, opt));
		}
		if(data === 'main') ctx.editMessageReplyMarkup(this.gen(ctx, false, false, opt));
		if(typeof(data) === 'string' && data.startsWith('!')) {
			if(this.prev[ctx.chat.id] === cmd) return debug('old value');
			this.prev[ctx.chat.id] = cmd;
			let text = this.setting.i18n ? ctx.i18n.t(data.substring(1), this.data) : data.substring(1);
			ctx.editMessageText(text, this.gen(ctx, false, true, opt).HTML()).catch(e => {})
		}
		if(typeof(data) === 'string' && data.startsWith('~')) {
			let text = this.setting.i18n ? ctx.i18n.t(data.substring(1), this.data) : data.substring(1);
			ctx.answerCallbackQuery(text, undefined, true);
		}
	}

	gen(ctx, path, isExtra, opt = []){
		path = this._menu[path];
		let data = path ? dot.pick(path, this.menu) : this.menu;
		let buttons = [];

		if(!Array.isArray(opt)) opt = [opt];

		Object.keys(data).forEach( e => {
			let dot = `${path ? path + '.' : ''}${e}`;
			let p = this.md5(dot);
			let text = this.setting.i18n ? ctx.i18n.t(e) : e;
			if(this.prev[ctx.chat.id] !== dot && (this.prev[ctx.chat.id] || this.hide !== dot)) {
				if(typeof data[e] === 'string' && data[e].startsWith('url:')){
					buttons.push(
						Markup.urlButton(text, data[e].substring(4))
					)
				} else {
					buttons.push(
						bot.router.callbackButton(
							text,
							'm_' + this.name,
							[p].concat(opt)
						)
					)
				}
			}
		});

		let option = {};
		const isFunc = typeof this.setting.columns === 'function';

		option[isFunc ? 'wrap' : 'columns'] = this.setting.columns;
		let mark = Markup.inlineKeyboard(buttons, option);

		if(isExtra) return Extra.markup(mark);
		return mark
	}

	extra(ctx, opt){
		return this.gen(ctx, false, true, opt);
	}

};
