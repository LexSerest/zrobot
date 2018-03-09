"use strict";

global.Cache = class extends Map {
	constructor(interval = 10 * 1000 * 60){
		super();
		this._interval = interval;
		this._timer = setInterval(e => this.clear(), interval + 1000);
		this._cacheInfo = new Map();
	}

	get(key){
		this._cacheInfo.set(key, +new Date());
		return super.get(key)
	}

	set(key, value){
		this._cacheInfo.set(key, +new Date());
		return super.set(key, value);
	}

	clear(){
		this._cacheInfo.forEach((value, key) => {
			if(value < +new Date() - this._interval){
				super.delete(key);
				this._cacheInfo.delete(key);
			}
		});
	}
};
