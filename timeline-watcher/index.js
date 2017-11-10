'use strict';

const fs = require('fs');
const BigNumber = require('bignumber.js');
const moment = require('moment');
require('colors');

const Util = require('../lib/util.js');
const Tweet = require('../lib/tweet.js').Tweet;
const JSONUpdater = require('../lib/json-updater.js');

const config = require('../config/main.json');
const materials = require('../config/materials.js');

const dbJSON = new JSONUpdater('./db/timeline-watcher.json');
const db = dbJSON.value;

module.exports = class TimelineWatcher {
  constructor(client) {
    this.client = client;
  }

  async notifyMe(tweet) {
    function getMessage(tweet, decorates=false) {
      const createdAt = new Date(tweet.created_at);
      const titles = [];

      titles.push(moment(createdAt).format('YYYY-MM-DD HH:mm:ss'));
      titles.push(`@${tweet.user.screen_name}`);
      if (tweet.user.protected) {
        titles.push('P'.red)
      }

      if (decorates) {
        titles[1] = titles[1].magenta;
        if (titles[2]) {
          titles[2] = titles[2].red;
        }
      }

      let title = titles.join(' ');
      if (decorates) {
        title = title.bold;
      }

      return `${title}: ${tweet.text}`;
    }

    console.log(getMessage(tweet, true));
    fs.appendFileSync('./.log', getMessage(tweet) + '\n');

    if (tweet.isProtected()) {
      try {
        await this.client.post('direct_messages/new', {
          user_id: config.me.id_str,
          text: tweet.getTweetURL(true)
        });
      } catch (error) {
        console.log(error);
      }
    } else {
      try {
        await this.client.post('collections/entries/add', {
          id: config.collection.timeline_id,
          tweet_id: tweet.id_str
        });
      } catch (error) {
        console.log(error);
      }
    }
  }

  async airReply(tweet) {
    let material;
    for (let i = 0; i < materials.responses.length; i++) {
      if (!materials.responses[i].reg ||
          materials.responses[i].reg.test(tweet.text)) {
        material = materials.responses[i];
        break;
      }
    }

    if (material) {
      let prob = 1;
      prob *= Util.getCurrentScore(db.dig('scores', 'users', tweet.user.id_str));
      prob *= Math.pow(2, Math.min(tweet.text.length, 140) / 140);
      if (material.useScore) {
        prob *= Util.getCurrentScore(db.dig('scores', 'responses', material.name));
      }

      if (Math.random() < prob) {
        let posted = false;
        try {
          if (!tweet.isProtected()) {
            await this.client.post('statuses/retweet/' + tweet.id_str, {
              id: tweet.id_str
            });
            posted = true;
          }

          await this.client.post('statuses/update', {
            status: `${material.getTweetBody(tweet)} #bot`
          });
          posted = true;
        } catch (error) {
          console.log(error);
        }

        if (posted) {
          Util.halveScore(db.dig('scores', 'users', tweet.user.id_str));
          Util.getDeepObject(
            db, 'scores', 'users', tweet.user.id_str
          ).screen_name = tweet.user.screen_name;
          if (material.useScore) {
            Util.halveScore(db.dig('scores', 'responses', material.name));
          }
          dbJSON.writeSync();
        }
      }
    }
  }

  async processTweet(tweet, isStreaming=false) {
    let ps = [];

    if (tweet.user && !tweet.isTweetedBy(config.me) &&
        !tweet.isRetweet() && !tweet.isReplyTo(config.me) &&
        !tweet.isQuoteOf(config.me)) {
      if (materials.common.regs[0].test(tweet.text) ||
          materials.common.regs[1].test(tweet.text)) {
        ps.push(this.notifyMe(tweet));
      }

      if (isStreaming && !tweet.isReply() &&
          materials.common.regs[0].test(tweet.text)) {
        ps.push(this.airReply(tweet));
      }
    }

    return Promise.all(ps);
  }

  async getPastTweets(since_id, max_id) {
    const params = {};
    params.count = 200;
    if (since_id) {
      params.since_id = since_id;
    }
    if (max_id) {
      params.max_id = max_id;
    }

    try {
      const tweets = await this.client.get('statuses/home_timeline', params);
      if (tweets.length !== 0) {
        const tweets0 = await this.getPastTweets(
          since_id,
          new BigNumber(tweets[tweets.length - 1].id_str).minus(1).toString()
        );

        for (let i = 0; i < tweets.length; i++) {
          tweets0.push(tweets[tweets.length - i - 1]);
        }
        return tweets0;
      } else {
        return [];
      }
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async processPastTweets() {
    const tweets = await this.getPastTweets(db.dig('lastTweet').id_str);

    if (tweets.length !== 0) {
      for (let i in tweets) {
        await this.processTweet(new Tweet(tweets[i]));
      }

      db.dig('lastTweet').id_str = tweets[tweets.length - 1].id_str;
      dbJSON.writeSync();

      console.log(`${tweets.length}件のツイートを処理しました`);
    }
  }

  async start() {
    await this.processPastTweets();

    const stream = this.client.stream('user');
    stream.on('data', async tweet => {
      await this.processTweet(new Tweet(tweet), true);

      db.dig('lastTweet').id_str = tweet.id_str;
      dbJSON.writeSync();
    });
    stream.on('error', error => {
      console.log(error);
    });
  }
}
