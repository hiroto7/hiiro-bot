module.exports = class Tweet {
  constructor(tweet) {
    Object.assign(this, tweet);
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
    return this.user.protected;
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
