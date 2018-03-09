'use strict';


const logger = require("mag")('bot:modules:plugins');
const PATH = require("path");
const glob = require("glob");
const yaml = require('js-yaml');
const fs = require('fs');


/**
 * Модуль для загрузки плангинов
 */

class Plugins {
	constructor(path) {
		this.list_plugins = [];
		this.list_mods = [];
		this.list_lang = [];
		this.path_plugins = PATH.join(process.cwd(), path + 'plugins/');
		this.path_mods = PATH.join(process.cwd(), path + 'mods/');
		this.load();
	}

	load(){

		glob.sync(this.path_mods + '!(_)*.js').forEach(e => {
			let name = PATH.basename(e).replace(/\..+$/, '');
			try {
				require(e);
				this.list_mods.push(name);
			} catch (e){
				logger.warn("Mods load error ", e.message, e.stack);
			}
		});

		glob.sync(process.cwd() + '/lang/*.yaml').forEach(e => {
			let data = fs.readFileSync(e, 'utf8');
			let locale = PATH.basename(e).replace(/\..+$/, '');

			try {
				api.locales.loadLocale(locale, yaml.safeLoad(data));
			} catch (err){
				logger.warn("Main lang error: ", e, err.message, err.stack);
			}
		});

		glob.sync(this.path_plugins + '!(_)*/lang/*.yaml').forEach(e => {
			let data = fs.readFileSync(e, 'utf8');
			let locale = PATH.basename(e).replace(/\..+$/, '');
			let plugin = e.match(/(\w+)\/lang\//)[1];
			//this.list_lang.push(`${locale} - ${plugin}`);

			try {
				api.locales.loadLocale(locale, yaml.safeLoad(data));
			} catch (err){
				logger.warn("Plugins lang error: ", e, err.message, err.stack);
			}
		});

		glob.sync(this.path_plugins + '!(_)*/index.js').forEach(e => {
			let name = e.match(/(\w+)\/index/)[1];
			try {
				require(e);
				this.list_plugins.push(name);
			} catch (e){
				logger.warn("Plugins load error ", e.message, e.stack);
			}
		});

		glob.sync(this.path_plugins + '!(_)*.js').forEach(e => {
			let name = PATH.basename(e).replace(/\..+$/, '');
			try {
				require(e);
				this.list_plugins.push(name);
			} catch (e){
				logger.warn("Plugins load error ", e.message, e.stack);
			}
		});

		glob.sync(this.path_plugins + '!(_)*.js').forEach(e => {
			let name = PATH.basename(e).replace(/\..+$/, '');
			try {
				require(e);
				this.list_plugins.push(name);
			} catch (e){
				logger.warn("Plugins load error ", e.message, e.stack);
			}
		});


		logger.info("Load mods: %s", this.list_mods.join(', '));
		logger.info("Load plugins: %s", this.list_plugins.join(', '));
		//logger.info("Load lang: %s", this.list_lang.join(', '))
	}
}


new Plugins("./");