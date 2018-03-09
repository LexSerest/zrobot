"use strict";


module.exports = txt => {
	txt = txt.toLowerCase();

	if(txt.length < 5) return txt.replace(/[^a-zа-я? ]/gui, '');

	txt = txt.replace(/(^| )(bot|бот)( |$)/gui, ' ')
		.replace(/[^a-zа-я? ]/gui, '')
		.replace(/[яиюыаоэуеёaqeyuio]/gui, '')
		.replace(/ +/g, ' ')
		.trim();

	if(txt.split(' ').length > 2) txt = txt.split(' ').map(e => e.length >= 2 ? e : '').join('');

	return txt.replace(/ +/g, '');
};