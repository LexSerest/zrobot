
# zRobot

Telegram bot using mongoDB and [telegraf](https://github.com/telegraf/telegraf) 

### Features
* Easy to expand
* Easy write plugin
* Easy create inline menu
* Built-in multilingual support

## Example config.json 
``` js
{
	"token": "<token bot>",
	"token_test": "<token test-bot>",
	"admin_id": <you id>,
    "url_db": "mongodb://localhost:27017/test",
	"kona": { // for board plugin 
		"limit": 30,
		"use_gm": false,
		"isLoadBigGif": true
	},
	
	"webhook": {
		"use": false
	}
}
```

## For run
### mongoDB v3.4 is required to run 
```
cp config.json.example config.json && nano config.json
npm install
npm run test # run for test (uses token_test)
npm run start # run (uses token)
```

# TODO
* Write docs
* Refactoring code
* Clear and commented code
* Rewrite README.md

