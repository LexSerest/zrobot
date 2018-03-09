const debug = require('debug')('core:module:spec');

class Task {
	constructor(time) {
		this._post = []; // [{f, args}]
		this.timer = () => setTimeout(() => {
			this.f()
		}, time);

		this.timer();
	}

	f(){
		if(this._post.length) {
			let f = this._post.shift();
			let promise = f();

			if(promise && promise.then) {
				promise
				.then(e => this.timer())
				.catch(e => this.timer())
			} else this.timer();
		} else this.timer();
	}

	add(f) {
		this._post.push(f);
	}
}
class Base {
	constructor() {
		this.base = {};
		// {tag:[{id, url}]}
	}

	add(key, obj) {
		this.base[key] = this.base[key] || [];
		if(obj.isArray) this.base[key].concat(obj);
		else this.base[key].push(obj);
	}

	get(key) {
		if(this.base[key]) return this.base[key].shift();
	}

	length(key) {
		if(this.base[key]) return this.base[key].length;
	}
}
class Small {
	constructor() {
		this.base = [];
		// FIXME: auto clear
	}

	test(txt) {
		let find = this.base.indexOf(txt);
		if(find != -1) return find;

		if(txt.length > 45) {
			return this.base.push(txt) - 1;
		}
		return txt;
	}

	get(n) {
		if(typeof(n) == "number" || /^\d+$/.test(n))
			if(this.base[n]) return this.base[n];
			else return "";
		return n;
	}
}
class Cached {
	constructor(time, testTime = 10){
		this.base = {};
		this.time = time;
		this.timer = setInterval(()=> this.clear(), 1000*60*testTime);
	}

	clear(){
		for(let e in this.base){
			if(this.base[e]._date < (+new Date()/1000 >> 0) + this.time * 60)
				delete this.base[e]
		}
	}

	get(id){
		id = id + "";
		debug("cached get", id);
		return this.base[id];
	}

	set(id, data){
		id = id + "";
		debug("cached set", id);
		if(!this.base[id]) this.base[id] = {};
		this.base[id]._date = +new Date()/1000 >> 0;
		Object.assign(this.base[id], data);
	}
}
class User {
	constructor(blockTime = 1200, timer = 1500) {
		this.base = {};
		this.time = blockTime;
		this.timer = setInterval(() => this.clear(), timer)
	}

	clear(){
		for(let e in this.base){
			if(this.base[e] < (+new Date() - this.time)) {
				delete this.base[e];
			}
		}
	}

	block(id){
		this.base[id] = +new Date();
	}

	isBlock(id){
		return !!this.base[id];
	}

	unBlock(id){
		if(this.base[id]) delete this.base[id];
	}

}

Object.assign(module.exports, {Task, Base, Small, Cached, User});