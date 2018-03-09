"use strict";

const funcs = require('./funcs');

module.exports = {
	changeName(ctx, name, oldName){
		if(!name || !oldName) return;
		name = funcs.remove_rtl(funcs.r_text(name, true));
		oldName = funcs.remove_rtl(funcs.r_text(oldName, true));
		if(name !== oldName) ctx.replyWithHTML(ctx.i18n.t('chats.changeName', {name, oldName}))
	}
};