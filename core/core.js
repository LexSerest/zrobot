'use strict';

const logger = require("mag")('bot:core');
const fs = require("fs");
const debug = require('debug')('bot:core');
const Telegraf = require('telegraf');
const { session } = require('telegraf');
const i18n = require('telegraf-i18n');
const MongoClient = require('mongodb').MongoClient;

let exec = require('child_process').execSync;

if(!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

class Core {
	constructor(config){
		this.config = config;
		global.isDebug = process.env.NODE_ENV === 'dev';
		if(isDebug) this.config.token = this.config.token_test || this.config.token;

		require('./callapi');
		// global
		global.api = this;

		global.bot = new Telegraf(this.config.token);

		this.version = +exec('git rev-list --all --count') / 100;
		this.locales = new i18n();

		this.events();
		this.db_connect().then(e => {
			if(!e) return;
			this.start()
		})
	}


	start(){
		bot.telegram.getMe()
		.then(e => {
			this.username = bot.username = e.username;
			this.id = bot.id = e.id;
			bot.options.username = e.username;
			if(!isDebug && this.config.webhook.use) {
				logger.info('use webhook');
				bot.telegram.deleteWebhook();
				bot.telegram.setWebhook(this.config.webhook.url, {
					source: fs.readFileSync(this.config.webhook.public)
				}).catch(logger.warn);
				bot.startWebhook(this.config.webhook.secret, null, 7771).catch(logger.warn)
			} else {
				bot.telegram.deleteWebhook().then(e => bot.startPolling());
			}

			logger.info('Start bot. Username: @' + this.username);
			bot.telegram.sendMessage(this.config.admin_id, 'I\'m alive');
		}).then(e => this.middlewares())
		.catch(e => logger.warn('Run bot error:', e))
	}

	db_connect(){
		return MongoClient.connect(this.config.url_db)
		.then(db => {
			logger.info('MongoDB connect ' + this.config.url_db);
			api.mongo = db;
			return true;
		})
		.catch(e => logger.warn('MongoDB error', e.message))
	}

	middlewares(){
		bot.use(session({property: 'session', getSessionKey: ctx => ctx.chat ? ctx.chat.id : 0}));
		bot.use(session({property: 'uSession', getSessionKey: ctx => ctx.from ? ctx.from.id : 0}));
		bot.use(this.locales.middleware()); // локализация

		require('./libs/index');      // различный функционал упрощающий жизнь
		require("./middlewares/index");
	}

	events(){
		process.on('unhandledRejection',  e => logger.warn("\nPromise ERROR: ", e));
		process.on('UnhandledPromiseRejectionWarning',  e => logger.warn("\nPromise reject ERROR: ", e));
		bot.catch( e => logger.warn("Telegraf error: ", e));
	}
}

module.exports = config => new Core(config);
