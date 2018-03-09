"use strict";

async function test() {
	await require('./core')();
	try {

		bot.run('on', {
				chat: {
					"id": -1001062377337,
					"title": "Anime/Hentai Chat 💦",
					"username": "hentai_ru",
					"type": "supergroup"
				},
				from: {"id": 47312551, "first_name": "Vano [LME15]", "username": "Vano64"}
			})
	} catch (e){
		console.log(e)
	}
}

test();