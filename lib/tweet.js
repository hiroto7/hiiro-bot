'use strict';

class Tweet {
  constructor(tweet) {
    for (let i in tweet) {
      if (
        tweet[i] === tweet.retweeted_status ||
        tweet[i] === tweet.quoted_status
      ) {
        this[i] = new Tweet(tweet[i]);
      } else if (tweet[i] === tweet.user) {
        this[i] = new User(tweet[i]);
      } else if (tweet[i] === tweet.entities) {
        this[i] = new TweetEntities(tweet[i]);
      } else {
        this[i] = tweet[i];
      }
    }
  }

  /**
   * ツイートが引数で与えられたアプリケーションから呟かれたものであるかどうか判定します．
   * @param {string} name 判定するアプリケーションの名称
   * @return {boolean} 引数で与えられたアプリケーションから呟かれたものであればtrue
   */
  isTweetedFrom(name) {
    return new RegExp(name).test(this.source);
  }

  /**
   * ツイートが引数で与えられたユーザーが呟いたものであるかどうか判定します．
   * @param {User} user 判定するユーザー
   * @return {boolean} 引数で与えられたユーザーが呟いたものであればtrue
   */
  isTweetedBy(user) {
    return this.user.isSameAs(user);
  }

  /**
   * ツイートが引数で与えられたユーザー宛てのリプライであるかどうか判定します．
   * @param {User} user 判定するユーザー
   * @return {boolean} 引数で与えられたユーザー宛てのリプライであればtrue
   */
  isReplyTo(user) {
    for (let i = 0; i < this.entities.user_mentions.length; i++) {
      if (this.entities.user_mentions[i].isSameAs(user)) {
        return true;
      }
    }
    return false;
  }

  /**
   * ツイートが引数で与えられたユーザーのツイートの引用であるかどうか判定します
   * @param {User} user 判定するユーザー
   * @return {boolean} 引数で与えられたユーザーのツイートを引用していればtrue
   */
  isQuoteOf(user) {
    return this.quoted_status && this.quoted_status.user.isSameAs(user);
  }

  /**
   * ツイートがリツイートであるかどうか判定します．
   * @return {boolean} リツイートであればtrue
   */
  isRetweet() {
    return !!this.retweeted_status;
  }

  /**
   * ツイートが引用ツイートであるかどうか判定します．
   * @return {boolean} 引用ツイートであればtrue
   */
  isQuote() {
    return !!this.quoted_status;
  }

  /**
   * ツイートがリプライであるかどうか判定します．
   * @return {boolean} リプライであればtrue
   */
  isReply() {
    return this.entities.user_mentions.length !== 0;
  }

  /**
   * ツイートが非公開であるかどうか判定します．
   * @return {boolean} 非公開であればtrue
   */
  isProtected() {
    return this.user.isProtected();
  }

  /**
   * ツイートへのURLを生成します．
   * @param {boolean} [option=false] trueの場合はURLにscreen_nameを使用し，
   *     falseの場合はURLにuser_idを使用します．
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
   * ユーザーが引数で与えられたユーザーと同一であるかどうか判定します．
   * @param {User} user 判定するユーザー
   * @return {boolean} 引数で与えられたユーザーと同一であればtrue
   */
  isSameAs(user) {
    return this.id_str === user.id_str;
  }

  /**
   * ユーザーのツイートが非公開であるかどうか判定します．
   * @return {boolean} 非公開であればtrue
   */
  isProtected() {
    return this.protected;
  }

  /**
   * ユーザーが引数で与えられたリストに含まれているかどうか判定します．
   * @param {UserList} list 判定するリスト
   * @return {boolean} 引数で与えられたリストに含まれていればtrue
   */
  isListedAt(list) {
    for (let i in list) {
      if (list[i].isSameAs(this)) {
        return true;
      }
    }
    return false;
  }

  /**
   * ユーザーが引数で与えられたユーザーをフォローしているかどうか判定します．
   * @param {User} user 判定するユーザー
   * @param {Twitter} client
   * @return {boolean} 引数で与えられたユーザーをフォローしていればtrue
   */
  async isFollowing(user, client) {
    const data = await client.get('friendships/show', {
      source_id: this.id_str,
      target_id: user.id_str
    });
    const source = new User(data.relationship.source);
    return source.following;
  }

  /**
   * ユーザーが引数で与えられたユーザーにフォローされているかどうか判定します．
   * @param {User} user 判定するユーザー
   * @param {Twitter} client
   * @return {boolean} 引数で与えられたユーザーにフォローされていればtrue
   */
  async isFollowedBy(user, client) {
    return await user.isFollowing(this);
  }
}

class DirectMessage {
  constructor(dm) {
    for (let i in dm) {
      if (dm[i] === dm.sender || dm[i] === dm.recipient) {
        this[i] = new User(dm[i]);
      } else if (dm[i] === dm.entities) {
        this[i] = new TweetEntities(dm[i]);
      } else {
        this[i] = dm[i];
      }
    }
  }
}

class TweetEntities {
  constructor(entities) {
    for (let i in entities) {
      if (entities[i] === entities.user_mentions) {
        this[i] = new UserList(entities[i]);
      } else {
        this[i] = entities[i];
      }
    }
  }
}

class TweetList extends Array {
  constructor(tweets) {
    super();
    for (let i in tweets) {
      this[i] = new Tweet(tweets[i]);
    }
  }
}

class UserList extends Array {
  constructor(users) {
    super();
    for (let i in users) {
      this[i] = new User(users[i]);
    }
  }
}

module.exports = {Tweet, User, DirectMessage, TweetList, UserList};
