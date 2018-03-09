"use strict";


const fs = require('fs');
const logger = require("mag")('core:plugins:help');
const util = require('util');

const onlyPrivate = libs.middlewares.onlyPrivate(true);

let menu = new Menu('help', require('./menu'), {
	i18n: true,
	columns: 1,
	hide: 'help_main'
}, {version: api.version});

bot.cmd('help', { notEmptyName: true },  ctx => {
	ctx.reply(ctx.i18n.t('help', {version: api.version}), menu.extra(ctx).HTML()).catch(e => {});
});

bot.cmd('start', onlyPrivate, (ctx) => {
	ctx.reply(ctx.i18n.t('start')).catch(e => {});
});
