const {  Markup }= require('telegraf');

// FIXME: исправить автопостинг

class admin {
	constructor(api) {
		this.api = api;

		api.bot.command("admin", (ctx) =>{
			if(ctx.chat.type == "private" && (api.db["admin"].indexOf(ctx.from.id) != -1))
			ctx.reply('Выберете команду', this.markup.lignthMarkup.extra());
		});

		api.bot.queryRouter.on("admin", ctx => {
			if(!ctx.command.length) return;
			if(api.db["admin"].indexOf(ctx.chat.id) == -1) return;
			let cmd = ctx.command[0];
			if(this.ligthCommand[cmd]) this.ligthCommand[cmd](ctx);
			if(this.highCommand[cmd]) this.highCommand[cmd](ctx);
		});
		api.bot.queryRouter.on("post", ctx => {
			if(!ctx.command.length) return;
			if(api.db["admin"].indexOf(ctx.chat.id) == -1) return;
			let cmd = ctx.command[0];
			if(this.post[cmd]) this.post[cmd](ctx);
		});

		api.bot.queryRouter.on("channel_del", ctx => {
			if(!ctx.command.length) return;
			if(api.db["admin"].indexOf(ctx.chat.id) == -1) return;
			let id = api.db["channel_command"].indexOf(+ctx.command[0]);
			ctx.answerCbQuery(api.db["channel_command"].splice(id, 1) + " удалено");
		});

		this.command();
		this.init();
	}

	init() {
		let createButton = (command) => Markup.callbackButton(command, "admin:" + command);

		this.markup = {
			lignthMarkup: Markup.inlineKeyboard(Object.keys(this.ligthCommand).map(e => createButton(e)), {columns: 4}),
			highMarkup: Markup.inlineKeyboard(Object.keys(this.highCommand).map(e => createButton(e)), {columns: 3}),
		};
	}

	command() {
		let exec = require('child_process').exec;
		this.post = {
			"post": ctx => {
				ctx.reply("начал постинг");
				this.api.autopost.post();
			},
			"set channel": ctx => {
				ctx.onReply("сколько слать? ранее: " + this.api.db["autopost"].channel, ctx => {
					this.api.db["autopost"].channel = ctx.message.text;
					ctx.reply("Установленно - " + ctx.message.text);
				})
			},
			"set count": ctx => {
				ctx.onReply("сколько слать? ранее: " + this.api.db["autopost"].count, ctx => {
					let count = +ctx.message.text;
					if(!count) return ctx.reply("Вы должны отрпавить число.");
					this.api.db["autopost"].count = count;
					ctx.reply("Установленно - " + count);
				})
			},
			"set tags": ctx => {
				ctx.onReply("Пришли теги для поиска. предыдущие:\n" + this.api.db["autopost"].tags, ctx => {
					this.api.db["autopost"].tags = ctx.message.text;
					ctx.reply("Установленно - " + ctx.message.text);
				})
			},
			"set isFull": ctx => {
				this.api.db["autopost"].isFull = !this.api.db["autopost"].isFull;
				ctx.answerCbQuery(this.api.db["autopost"].isFull.toString(), undefined, true);
			},
			"set time": ctx => {
				ctx.onReply("Через сколько часов постить? ранее: " + this.api.db["autopost"].time, ctx => {
					let time = +ctx.message.text;
					if(!time) return ctx.reply("Вы должны отрпавить число.");
					this.api.db["autopost"].time = time;
					ctx.reply("Каждые " + time);
				})
			},
			"close": ctx => ctx.editMessageReplyMarkup(this.markup.lignthMarkup)
		};
		this.ligthCommand = {
			// статистика использования (собирается при помощи плангина logger) //
			"stats": ctx => ctx.reply(this.api.logger.getInfo(10)),

			"free": ctx => exec("free -h", (error, stdout, stderr) => ctx.reply(stdout)),

			// отправляет файл с логами
			"log": ctx => {
				ctx.replyWithDocument({
					source: process.env['HOME'] + "/zrobot.log",
					filename: "log.txt"
				});
			},
			"uptime": ctx => exec('uptime -p', (error, stdout, stderr) => ctx.reply(stdout)),

			//постинг в каналы (плангин autopost)
			"post": ctx => {
				let createButton = (command) => Markup.callbackButton(command, "post:" + command);
				let mark = Markup.inlineKeyboard(Object.keys(this.post).map(e => createButton(e)), {columns: 3});
				ctx.editMessageReplyMarkup(mark);
			},
			"all command": ctx => ctx.editMessageReplyMarkup(this.markup.highMarkup)
		};

		this.highCommand = {

			// отправка сообщений пользователю
			"send": ctx => {

				let error = 0;
				let success = 0;
				let count = 0;

				let send = () => {
					if(count == error + success)
					ctx.reply(`Рассылка ${count} пользователям завершена. \n` +
						`Сообщение доставленно ${success} пользователям \n` +
						`Недоставленно ${error} пользователям`);
				};

				ctx.onReply('Кому отправляем? (в остольных случая - regexp)\n' +
					'a|all - все\n' +
					'p|private - только пользователям\n' +
					'd|deactive - неактивные пользователи', ctx => {
					let arr = this.api.logger.get(ctx.message.text);
					count = arr.length;

					ctx.onReply("Пришлите текст для рассылки", ctx => {
						let text = ctx.message.text;
						arr.forEach(id => {
							ctx.telegram.sendMessage(id, text)
							.then(e => { success++; send(); })
							.catch(e => { error++; send(); });
						});
					});
				});
			},

			"cmd channel add": ctx => {
				ctx.onReply("Пришли ид юсера", ctx2 => {
					let user = ctx2.message.text.trim();
					this.api.db["channel_command"].push(+user);
					ctx.answerCbQuery("Добавлен " + user)
				})
			},

			"cmd channel del": ctx => {
				let arr = [];

				this.api.db["channel_command"].forEach(e => {
					if(this.api.db["admin"].indexOf(e) == -1)
						arr.push(Markup.callbackButton(e+ "", "channel_del:" + e));
				});

				ctx.reply("Выберете для удаления", Markup.inlineKeyboard(arr, {columns: 1}).extra())
			},
			// установка текста по комманде /help
			"set help": ctx => {
				ctx.onReply("Пришли текст помощи", ctx => {
					require('fs').writeFileSync('./helps/help.txt', ctx.message.text);
					this.api.help = ctx.message.text;
					ctx.reply("Help replace.");
				})
			},

			// установка текста по команде /start
			"set start": ctx => {
				ctx.onReply("Пришли текст при команде /start", ctx => {
					require('fs').writeFileSync('./helps/start.txt', ctx.message.text);
					this.api.help = ctx.message.text;
					ctx.reply("Start replace.");
				})
			},

			// включение/отключение автопостинга
			"autopost auto": ctx => {
				ctx.answerCbQuery(this.api.autopost.setAuto() + "");
			},
			"use gm (kona)": ctx => {
				this.api.config.kona.use_gm = !this.api.config.kona.use_gm;
				ctx.answerCbQuery(this.api.config.kona.use_gm.toString(), undefined, true);
			},
			"use gm (channel)": ctx => {
				this.api.config.channel.use_gm = !this.api.config.channel.use_gm;
				ctx.answerCbQuery(this.api.config.channel.use_gm.toString(), undefined, true);
			},
			"ignore tags": ctx => {
				this.api.config.kona.ignoreTags = !this.api.config.kona.ignoreTags;
				ctx.answerCbQuery(this.api.config.kona.ignoreTags.toString(), undefined, true);
			},
			"pull": ctx => exec("cd ~/zrobot/ && git pull", (error, stdout, stderr) => ctx.reply(stdout)),
			"reboot": ctx => {
				this.api.logger._db.update();
				this.api.dbClass.forEach(e => e.update());
				ctx.answerCbQuery("Cохранено");
				ctx.reply("Bot reboot").then(e => {
					exec('nohup bash -c "sleep 5; ~/start.sh"');
					process.exit();
				})
			},
			"add admin": ctx => {
				ctx.onReply("Отправьте ID админа", ctx => {
					let id = +ctx.message.text;
					if (id) {
						this.api.db["admin"].push(id);
						ctx.answerCbQuery("Админ добавлен", undefined, true);
					}
				});
			},
			"clear admin": ctx => {
				this.api.db["admin"] = [this.api.config.admin_id];
				ctx.answerCbQuery("Админы очищены");
			},
			"db save": ctx => {
				this.api.logger._db.update();
				this.api.dbClass.forEach(e=> {
					e.update();
				});
				ctx.answerCbQuery("Cохранено");
			},
			"logging on/off": ctx => {
				this.api.config.logging = !this.api.config.logging;
				ctx.answerCbQuery(this.api.config.logging + "");
			},
			"Set proxy": ctx => {
				ctx.onReply("Пришли список в виде ip:port.\nТекущее прокси - " + this.api.db.proxy, ctx => {
					this.api.Proxy.test(ctx.message.text, e=> {
						if(e) ctx.reply(`Установленно прокси: ${e.proxy}\nЗадержка: ${e.time}`);
						else ctx.reply('Нормальных прокси нет. Установленно предыдущее.')
					})
				});
			},
			"hide": ctx => ctx.editMessageReplyMarkup(this.markup.lignthMarkup)
		}
	}
}

module.exports = {
	name: "admin",
	version: "0.0.0",
	author: "LexSerest",
	description: "плангин для управление ботом из телеграма",
	init: (api) => new admin(api)
};

