'use strict';

const Util = require('../lib/util.js');

const common = {
  regs: [
    /ひいろ/gi, //通知とエアリプの両方の対象になる正規表現
    /hiiro/gi //通知のみの対象になる正規表現
  ]
};

const responses = [
  // 上のものが優先される
  {
    reg: /bot/gi,
    getTweetBody: function(tweet) {
      return tweet.text.match(this.reg)[0] + Util.pickRandom('です', 'だよ');
    }
  },
  {
    reg: /こんにちは/gi,
    getTweetBody: function(tweet) {
      return `${tweet.uset.name}さん、こんにちは！`;
    }
  },
  {
    name: 'default',
    getTweetBody: function(tweet) {
      return tweet.text.match(common[0].reg)[0] + Util.repeatRandom('…', 2 / 3);
    },
    useScore: true
  }
];

module.exports = {common, responses};
