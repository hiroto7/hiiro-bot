'use strict';

const {pickRandom, repeatRandom} = require('../../lib/util.js');

const common = {
  regs: [
    /ひいろ/i, //通知とエアリプの両方の対象になる正規表現
    /hiiro/i //通知のみの対象になる正規表現
  ]
};

const responses = [
  // 上のものが優先される
  {
    reg: /bot/i,
    getTweetBody: function(tweet) {
      return tweet.text.match(this.reg)[0] + pickRandom('です', 'だよ');
    }
  },
  {
    reg: /こんにちは/i,
    getTweetBody: function(tweet) {
      return `${tweet.uset.name}さん、こんにちは！`;
    }
  },
  {
    name: 'default',
    getTweetBody: function(tweet) {
      return tweet.text.match(common[0].reg)[0] + repeatRandom('…', 2 / 3);
    },
    useScore: true
  }
];

module.exports = {common, responses};
