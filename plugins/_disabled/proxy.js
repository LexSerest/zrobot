const request = require('request');


class Proxy{
	constructor(api){
		this.api = api;
		api.Proxy = this;

		this.testUrl = "https://ibsearch.xxx/";

		this.proxylist = [];
	}

	test(arr, callback){
		if(typeof(arr) == "string") arr = arr.split('\n');
		if(arr[0] != "!") this.proxylist = [];

		let chain = Promise.resolve();

		chain.catch(e=> {});

		arr.push(this.api.db.proxy);
		arr.forEach(p => {
			let proxy = p.trim().startsWith('http') ? p.trim() : 'http://' + p.trim();
			chain = chain
			.then(() => this.req(proxy))
			.catch((e) => {})
			.then(e => {
				if(!e) return;
				this.proxylist.push({
					proxy: (proxy),
					time: e
				});
			})
		});

		chain.then(() => {
			if(this.proxylist.length == 0) return callback();
			this.proxylist.sort((a, z) => a.time >= z.time);
			this.api.db.proxy = this.proxylist[0].proxy;
			callback(this.proxylist[0]);
		})
	}

	req(proxy) {
		return new Promise((ret, rej)=> {
			request({
				url: this.testUrl,
				proxy: proxy,
				timeout: 5000,
				time: true
			}, (e, r) => {
				if((e && e.error) || !r || (r && r.statusCode != 200)) return rej(e);
				return ret(r.elapsedTime);
			})
		})
	}

}

module.exports = {
	name: "proxy",
	version: "0.0.0",
	author: "LexSerest",
	description: "proxy",
	init: (api) => new Proxy(api)
};