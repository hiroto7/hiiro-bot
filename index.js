'use strict';

const Twitter = require('twitter');

const TimelineWatcher = require('./timeline-watcher');

const config = require('./config/main.json');

const client = new Twitter(config.keys);

const watcher = new TimelineWatcher(client);
watcher.start();
