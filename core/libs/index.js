"use strict";

require('./globals/Date');
require('./globals/Cache');
require('./globals/Menu');

global.libs = {};
global.libs.events = require('./events');
global.libs.middlewares = {
	botIsAdmin: require('./middlewares/bot-is-admin'),
	botIsAdminReply: require('./middlewares/bot-is-admin'),
	onlyAdmin: require('./middlewares/only-admin'),
	onlyAdminBot: require('./middlewares/only-admin-bot'),
	onlyGroup: require('./middlewares/only-group'),
	onlyPrivate: require('./middlewares/only-private'),
	locker: require('./middlewares/locker'),
	ignore: require('./middlewares/ignore'),
};
global.libs.funcs = require('./funcs');
