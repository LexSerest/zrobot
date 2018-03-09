'use strict';

const debug = require('debug')('bot:middlewares:limit');
const logger = require("mag")('bot:middlewares:limiter');

class ExpandedMemory {
	constructor(lockTime, runTime) {
		this.chats = new Map();
		this.lockTime = lockTime;
	}

	timeout(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async add(key, func, f = () => {}) {
		let lock = this.lockTime;

		debug('add', func, key);
		try {
			if (this.chats.get(key)) {
				debug('lock', key);
				this.chats.set(key, lock);
			} else {
				debug('locked', key);
				this.chats.set(key, lock);
				await this.timeout(lock);
				this.chats.delete(key);
				debug('end', key);

				try {
					return await f();
				} catch (e){
					debug(e.message);
				}
			}
		} catch (e) {
			logger.warn('Limiter error', e)
		}
	}
}

class Limiter {
	constructor(cfg) {
		this.config = Object.assign({
			lockTime: 1000,
			limit: 1,
			onLimit: () => {}
		}, cfg);

		this.task = new ExpandedMemory(this.config.lockTime, this.config.runTime);
	}

	forward(ctx, func){
		ctx['__' + func] = ctx[func];
		const key = ctx.chat.id + ':' + ctx.from.id;
		ctx[func] = (...args) => this.task.add(key, func, () => {
			try {
				ctx['__' + func](...args).catch(e => debug(e.message))
			} catch (e){
				debug(e);
			}
		});
	}

	middleware() {
		return (ctx, next) => {
			if(!ctx || !ctx.chat || !ctx.chat.id || !ctx.from || !ctx.from.id) return;
			const key = ctx.chat.id + ':' + ctx.from.id;
			this.forward(ctx, 'reply');
			//this.forward(ctx, 'replyWithHTML');
			this.forward(ctx, 'replyWithDocument');
			this.forward(ctx, 'replyWithPhoto'); // wtf? баг
			this.forward(ctx, 'editMessageText');
			this.forward(ctx, 'editMessageReplyMarkup');
			this.forward(ctx, 'answerCallbackQuery');
			next();
		}
	}
}


const component = new Limiter(api.config.limiter || {});
bot.use(component.middleware());
module.exports = Limiter;