'use strict';

process.chdir(require('path').dirname(process.mainModule.filename)); // магия

const Api = require('./core/core')(require('./config.json'));
