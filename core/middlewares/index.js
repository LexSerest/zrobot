"use strict";

require('./telegraf/prelimiter');   // обрезает запросы чаще 100мс
require('./telegraf/composer');     // добавляет ctx.cmd, выполняет так же последующию комманду (необходимо для /db/save)
require('./telegraf/helpers');      // сtx.text и ctx.isPrivate
require('./telegraf/plugin');       // ctx.onReply и роутеры для inline клавиатуры
require('./db/index');               // загрузка и запуск плангинов


// require('./db/init');               // инициализация базы данных
// require('./db/db');                 // запись в ctx.db информации о пользователе и чате
// require('./db/statistics');         // статистика сообщений (день, неделя, месяц, все время)
// require('./db/lang');               // определение языка и сохранение в бд информации о нем
// require('./db/events');             // различные внешние событии тг - смена имени и тд

//require('./lang');                  // применение языка
require('./plugins');               // загрузка и запуск плангинов

//require('./db/save');               // сохранение базы данных из ctx.db
