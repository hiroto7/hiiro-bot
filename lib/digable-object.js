module.exports = class DigableObject {
  constructor(obj) {
    Object.assign(this, obj);
  }

  /**
   * このオブジェクトの深くにある子孫オブジェクトへのアクセスを試みます．
   * 子孫オブジェクトがundefinedである場合は，空のオブジェクトが生成されます．
   * メソッドの実行によってこのオブジェクトは変更されます．
   * @param {string} path 子孫オブジェクトへアクセスするためのプロパティ名を順に指定する
   * @return {object} 孫オブジェクト
   */
  dig(...path) {
    let child = this;
    for (let i in path) {
      if (child[path[i]] === undefined) {
        child[path[i]] = {};
      }
      child = child[path[i]];
    }
    return child;
  }
}
