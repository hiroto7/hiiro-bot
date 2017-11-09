'use strict';

const Twitter = require('twitter');

const TimelineWatcher = require('./timeline-watcher');

const config = require('./configs/main.json');

const client = new Twitter(config.keys);

const watcher = new TimelineWatcher(client);
watcher.start();
