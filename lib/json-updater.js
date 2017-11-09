'use strict';

const fs = require('fs');

const DigableObject = require('./digable-object.js');

module.exports = class JSONUpdater {
  constructor(path, options) {
    if (typeof options === 'string') {
      options = options || 'utf-8';
    } else if (typeof options === 'object') {
      options.encoding = options.encoding || 'utf-8';
    }

    this.path = path;
    try {
      this.value = new DigableObject(JSON.parse(fs.readFileSync(this.path), options));
    } catch (e) {
      this.value = new DigableObject();
    }
  }

  writeSync(options) {
    fs.writeFileSync(this.path,
      JSON.stringify(this.value, null, 2) ,options);
  }
};
