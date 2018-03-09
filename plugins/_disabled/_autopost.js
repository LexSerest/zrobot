const gm = require('gm');
const request = require("request");
const { Markup } = require('telegraf');

// FIXME: исправить автопостинг (переписать?)

let random = (obj)=> {
	if(Array.isArray(obj)) return obj[Math.round(Math.random() * (obj.length - 1))];
	if(typeof obj == 'number') return Math.round(Math.random() * obj);
};

class autopost{
	constructor(api){
		api.autopost = this;
		this.config = api.db["autopost"];
		this.api = api;
		this.timer = false;

		if(this.config.isAutoPost)
		this.timer = setInterval(
			() => this.post(), this.config.time * 1000 * 60 * 60
		);
	}

	setAuto(){
		if(!this.timer) {
			this.timer = setInterval(() => this.post(),
				this.config.time * 1000 * 60 * 60);
		} else {
			clearInterval(this.timer);
			this.timer = false;
		}

		return !!this.timer;
	}

	post(channel){
		let channel = this.config.channel;



	}
}

module.exports = {
	name: "Images search",
	version: "0.0.0",
	author: "LexSerest",
	description: "автопостинг",
	init: (api) => {new autopost(api)}
};
