/**
 * @example
 * const obj = new DigableObject({
 *   a: {
 *     b: {
 *       c: {d: 1}
 *     }
 *   }
 * });
 *
 * obj.a.b.c; // {d: 1}
 * obj.dig('a', 'b', 'c'); // {d: 1}
 *
 * obj.a.b.e // undefined
 * obj.dig('a', 'b', 'e'); // {}
 * obj.a.b.e // {}
 *
 * obj.a.f.g // TypeError: Cannot read property 'g' of undefined
 * obj.dig('a', 'f', 'g'); // {}
 * obj.a.f.g // {}
 */
class DigableObject {
  constructor(obj) {
    Object.assign(this, obj);
  }

  /**
   * このオブジェクトの深くにある子孫オブジェクトへのアクセスを試みます．
   * 指定されたパスにオブジェクトが存在する場合は，そのオブジェクトを返します．
   * 指定されたパスにアクセスできない場合は，空のオブジェクトが生成されます．
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

module.exports = DigableObject;