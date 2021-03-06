'use strict';

const fs = require('fs');
const BigNumber = require('bignumber.js');
const moment = require('moment');
require('colors');

const {getCurrentScore, halveScore} = require('../lib/util.js');
const {Tweet, User, DirectMessage, TweetList, UserList} = require('../lib/tweet.js');
const JSONUpdater = require('../lib/json-updater.js');

const config0 = require('../config/main.json');
const config1 = require('../config/timeline-watcher/main.json')
const me = new User(config0.me);
const myCollection = config1.collection;
const blacklist = new UserList(config1.blacklist);

const materials = require('../config/timeline-watcher/materials.js');

const dbJSON = new JSONUpdater('./db/timeline-watcher/main.json', undefined, 2);
const db1JSON = new JSONUpdater('./db/timeline-watcher/timeline-by-period.json', undefined, 2);
const db = dbJSON.value;
const db1 = db1JSON.value;

module.exports = class TimelineWatcher {
  constructor(client) {
    this.client = client;
  }

  async notifyMe(tweet) {
    function getMessage(tweet) {
      const createdAt = new Date(tweet.created_at);
      const titles = [];

      titles.push(moment(createdAt).format('YYYY-MM-DD HH:mm:ss'));
      titles.push(`@${tweet.user.screen_name}`.magenta);
      if (tweet.user.protected) {
        titles.push('P'.red)
      }

      return `${titles.join(' ').bold}: ${tweet.text}`;
    }

    console.log(getMessage(tweet));
    fs.appendFileSync('./.log', getMessage(tweet) + '\n');

    if (tweet.isProtected()) {
      try {
        await this.client.post('direct_messages/new', {
          user_id: me.id_str,
          text: tweet.getTweetURL(true)
        });
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        await this.client.post('collections/entries/add', {
          id: myCollection.timeline_id,
          tweet_id: tweet.id_str
        });
      } catch (error) {
        console.error(error);
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
      prob *= getCurrentScore(db.dig('scores', 'users', tweet.user.id_str));
      prob *= Math.pow(2, Math.min(tweet.text.length, 140) / 140);
      if (material.useScore) {
        prob *= getCurrentScore(db.dig('scores', 'responses', material.name));
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
          console.error(error);
        }

        if (posted) {
          halveScore(db.dig('scores', 'users', tweet.user.id_str));
          db.dig('scores', 'users', tweet.user.id_str).screen_name = tweet.user.screen_name;
          if (material.useScore) {
            halveScore(db.dig('scores', 'responses', material.name));
          }
          dbJSON.writeSync();
        }
      }
    }
  }

  async processTweet(tweet, isStreaming=false) {
    const ps = [];

    if (!tweet.isTweetedBy(me) && !tweet.isRetweet() &&
        !tweet.isReplyTo(me) && !tweet.isQuoteOf(me)) {
      if (materials.common.regs[0].test(tweet.text) ||
          materials.common.regs[1].test(tweet.text)) {
        ps.push(this.notifyMe(tweet));
      }

      if (isStreaming && !tweet.isReply() &&
          !tweet.user.isListedAt(blacklist) &&
          materials.common.regs[0].test(tweet.text) &&
          await tweet.user.isFollowing(me, this.client)) {
        ps.push(this.airReply(tweet));
      }
    }

    db.dig('lastTweet').id_str = tweet.id_str;

    const createdAt = new Date(tweet.created_at);
    const byDate = (
      db1[moment(createdAt).format('YYYY-MM-DD')] =
      db1[moment(createdAt).format('YYYY-MM-DD')] || {
        total: 0
      }
    );
    const byHour = (
      byDate[createdAt.getHours()] =
      byDate[createdAt.getHours()] || {
        total: 0
      }
    );
    byDate.total++;
    byHour.total++;

    return Promise.all(ps);
  }

  async getPastTweets(url, params) {
    const pastTweets = [];
    const p = Object.assign({}, params);
    p.count = p.count || 200;

    while (true) {
      try {
        const tweets = await this.client.get(url, p);

        if (tweets.length === 0) {
          break;
        } else {
          pastTweets.push(...tweets);
          p.max_id = new BigNumber(tweets[tweets.length - 1].id_str).minus(1).toString();
        }
      } catch (error) {
        console.error(error);
        break;
      }
    }

    return pastTweets;
  }

  async processPastTweets() {
    const data = await this.getPastTweets('statuses/home_timeline', {
      since_id: db.dig('lastTweet').id_str
    });
    const tweets = new TweetList(data).reverse();

    if (tweets.length !== 0) {
      for (let i in tweets) {
        await this.processTweet(tweets[i]);
      }

      dbJSON.writeSync();
      db1JSON.writeSync();

      console.log(`${tweets.length}件のツイートを処理しました`);
    }
  }

  async start() {
    try {
      await this.processPastTweets();

      const stream = this.client.stream('user');
      stream.on('data', async data => {
        try {
          if (data.direct_message) {
            const dm = new DirectMessage(data);
          } else {
            const tweet = new Tweet(data);
            await this.processTweet(tweet, true);

            dbJSON.writeSync();
            db1JSON.writeSync();
          }
        } catch (error) {
          console.error(error);
        }
      });
      stream.on('error', error => {
        console.error(error);
      });
    } catch (error) {
      console.error(error);
    }
  }
}
