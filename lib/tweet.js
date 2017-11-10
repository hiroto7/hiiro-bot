class Tweet {
  constructor(tweet) {
    for (let i in tweet) {
      switch (tweet[i]) {
        case tweet.user: {
          this[i] = new User(tweet[i]);
        } break;

        case tweet.quoted_status: {
          this[i] = new Tweet(tweet[i]);
        } break;

        case tweet.entities: {
          this[i] = new TweetEntities(tweet[i]);
        } break;

        default: {
          this[i] = tweet[i];
        }
      }
    }
  }

  /**
   * ツイートが指定されたアプリケーションから呟かれたものであるかを返します．
   * @param {string} name 判定するアプリケーションの名称
   * @return {boolean} 指定されたアプリケーションから呟かれたものであればtrue
   */
  isTweetedFrom(name) {
    return new RegExp(name).test(this.source);
  }

  /**
   * ツイートが指定されたユーザーが呟いたものであるかどうかを返します．
   * @param {object} user 判定するユーザー
   * @return {boolean} 指定されたユーザーが呟いたものであればtrue
   */
  isTweetedBy(user) {
    return this.user.id_str === user.id_str;
  }

  /**
   * ツイートが指定されたユーザー宛てのリプライであるかどうかを返します．
   * @param {object} user 判定するユーザー
   * @return {boolean} 指定されたユーザー宛てのリプライであればtrue
   */
  isReplyTo(user) {
    for (let i = 0; i < this.entities.user_mentions.length; i++) {
      if (this.entities.user_mentions[i].id_str === user.id_str) {
        return true;
      }
    }
    return false;
  }

  /**
   * ツイートが指定されたユーザーのツイートを引用しているかどうかを返します
   * @param {object} user 判定するユーザー
   * @return {boolean} 指定されたユーザーのツイートを引用していればtrue
   */
  isQuoteOf(user) {
    return this.quoted_status && this.quoted_status.user.id_str === user.id_str;
  }

  /**
   * ツイートがリツイートであるかどうかを返します．
   * @return {boolean} リツイートであればtrue
   */
  isRetweet() {
    return !!this.retweeted_status;
  }

  /**
   * ツイートが引用ツイートであるかどうかを返します．
   * @return {boolean} 引用ツイートであればtrue
   */
  isQuote() {
    return !!this.quoted_status;
  }

  /**
   * ツイートがリプライであるかどうかを返します．
   * @return {boolean} リプライであればtrue
   */
  isReply() {
    return this.entities.user_mentions.length !== 0;
  }

  /**
   * ツイートが非公開であるかどうかを返します．
   * @return {boolean} 非公開であればtrue
   */
  isProtected() {
    return this.user.isProtected();
  }

  /**
   * ツイートへのURLを生成します．
   * @param {boolean} [option=false] trueの場合はURLにscreen_nameを，falseの場合はURLにuser_idを使用します．
   * @return {string} ツイートのURL
   */
  getTweetURL(option=false) {
    return `https://twitter.com/${
      option ? this.user.id_str : this.user.screen_name
    }/status/${this.id_str}`;
  }
}

class User {
  constructor(user) {
    for (let i in user) {
      if (user[i] === user.status) {
        this[i] = new Tweet(user[i]);
      } else {
        this[i] = user[i];
      }
    }
  }

  /**
   * ユーザーのツイートが非公開であるかどうかを返します．
   * @return {boolean} 非公開であればtrue
   */
  isProtected() {
    return this.protected;
  }
}

class TweetEntities {
  constructor(entities) {
    for (let i in entities) {
      if (entities[i] === entities.user_mentions) {
        this[i] = [];
        for (let j in entities[i]) {
          this[i][j] = new User(entities[i][j]);
        }
      } else {
        this[i] = entities[i];
      }
    }
  }
}

module.exports = {Tweet, User, TweetEntities};
