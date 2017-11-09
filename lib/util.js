'use strict';

/**
 * 引数で与えられたアイテムから1つを無作為に選びます．
 * @param args 候補のアイテム
 * @return 選んだアイテム
 */
function pickRandom(...args) {
  return args[Math.floor(Math.random() * args.length)];
}

/**
 * 対象の文字列を一定の確率で繰り返します．
 * @param {string} str 対象の文字列
 * @param {number} p 繰り返し回数が1増える確率
 * @return {string} 繰り返し後の文字列
 */
function repeatRandom(str, p) {
  return str.repeat(Math.log(Math.random()) / Math.log(p));
}

function getCurrentScore(data) {
  const cycle = 1000 * 60 * 60 * 24;

  if (data.updatedAt && data.score) {
    const elapsedDays = (Date.now() - data.updatedAt) / cycle;
    return (elapsedDays < 1) ?
      Math.pow(data.score, 1 - elapsedDays) : 1;
  } else {
    return 1;
  }
}

function halveScore(data, options) {
  const nowDate = new Date();

  data.score = this.getCurrentScore(data) / 2;
  data.updatedAt = nowDate.getTime();
  data.updatedAtString = nowDate.toString();
}

/**
 * 親オブジェクト内の深い階層にある孫オブジェクトを取得します．
 * 子孫オブジェクトがundefinedである場合は，空のオブジェクトに置き換えられます．
 * 元のオブジェクトは変更される可能性があります．
 * @param {object} parent 親オブジェクト
 * @param {string} path 孫オブジェクトへアクセスするためのプロパティ名を順に指定する
 * @return {object} 孫オブジェクト
 */
function getDeepObject(parent, ...path) {
  let child = parent;
  for (let i in path) {
    if (child[path[i]] === undefined) {
      child[path[i]] = {};
    }
    child = child[path[i]];
  }
  return child;
}

module.exports = {
  pickRandom,
  repeatRandom,
  getCurrentScore,
  halveScore,
  getDeepObject
};
