module.exports = class DigableObject {
  constructor(obj) {
    Object.assign(this, obj);
  }

  /**
   * このオブジェクトの深くにある子孫オブジェクトへのアクセスを試みます．
   * 指定されたパスにオブジェクトが存在する場合は，そのオブジェクトを返します．
   * そのとき次は等価です: this[a][b][c] === this.dig(a, b, c)
   * 指定されたパスにアクセスできない場合やオブジェクトが存在しない場合は，
   * 空のオブジェクトが生成されます．
   * メソッドの実行によってオブジェクトは変更されます．
   * @param {string} path 子孫オブジェクトへアクセスするためのプロパティ名を順番に指定する
   * @return {object} 子孫オブジェクト
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
