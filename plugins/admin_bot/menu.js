"use strict";


const { Extra } = require('telegraf');
const logger = require("mag")('bot:plugins:admin_bot');
const exec = require('child_process').exec;

const { r_text, smaller } = libs.funcs;

function txt_gen(e){
	let title = r_text(smaller(e.title || e.first_name));
	let last = r_text(smaller(e.last_message));
	let url = e.username ? `<a href="http://t.me/${e.username}">${title}</a>` : title;

	return `${url} [${e.statistics.today}, ${e.statistics.all}, "${last}"]\n`;
}

module.exports = {
	"Bot": {
		"Pull": ctx => {
			exec("cd ~/zrobot/ && git pull", (err, stdout, stderr) => {
				if(err) return ctx.reply(err.message);
				ctx.reply(stdout)
			})
		},
		"Reboot": async ctx => {
			await api.db_save();
			ctx.reply('db save. Reboot...');
			exec('pm2 restart zrobot');
		},
		"save db": async ctx => {
			await api.db_save();
			ctx.reply('db save.');
		},
		"Used db": ctx => {
			let info = api.db_used();
			ctx.answerCbQuery(`Used db info. Chat:${info.chat} User:${info.user}`);
		},
		"Users": ctx => {
			let info = api.user_info();
			let count_user = Object.keys(info.user).length;
			let count_chat = Object.keys(info.chat).length;
			ctx.answerCbQuery(`Users info. Chat:${count_chat} User:${count_user}`);
		},

		'Main': 'main'
	},
	"Log": {
		'view out': ctx => {
			exec('tail -n 30 /home/bot/.pm2/logs/zrobot-out-0.log', (err, stdout, stderr) => {
				if(err) return ctx.reply(err.message);
				ctx.editMessageText(stdout, Extra.webPreview(false).markup(ctx.menu_mark)).catch(e => {});
			});
		},

		'view error': ctx => {
			exec('tail -n 30 /home/bot/.pm2/logs/zrobot-error-0.log', (err, stdout, stderr) => {
				if (err) return ctx.reply(err.message);
				ctx.editMessageText(stdout, Extra.webPreview(false).markup(ctx.menu_mark)).catch(e => {});
			});
		},

		'Main': 'main'
	}
};