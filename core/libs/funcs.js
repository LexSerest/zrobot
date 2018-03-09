"use strict";

module.exports = {
	smaller(txt, max = 25){
		if(!txt) return;
		if(txt.chat) return txt.message.text.slice(0, max) + (txt.length > max ? '...' : '');
		return txt.slice(0, max) + (txt.length > max ? '...' : '');
	},
	r_text(txt){
		if(typeof txt !== 'string') return '';
		return txt.replace(/</g, '&lt;');
	},
	remove_rtl(txt){
		if(typeof txt !== 'string') return '';
		return txt.replace(/[\u202E\u202E\u200F\u2067]/g, '')
	},
	rand(num, bool = false){
		if(typeof num === 'number') {
			if(bool) return ((Math.random() * num) >> 0) === 0;
			return (Math.random() * (num + 1)) >> 0;
		}
		if(typeof num === 'object') {
			if(Array.isArray(num)) return num[(Math.random() * num.length) >> 0];
			let keys = Object.keys(num);
			return num[keys[(Math.random() * keys.length) >> 0]]
		}
		return num;
	},
	ignore(text){
		return (!text || /^(pic|gif|\/|!|~)/.test(text));
	}
};