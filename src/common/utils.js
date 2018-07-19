function printObj(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

let timeNowSeconds;

if (isBrowser()) {
  timeNowSeconds = function() {
    const time = performance.now() / 1000;
    return time;
  }
}
else {
  timeNowSeconds = function timeNowSeconds() {
    const time = Date.now() / 1000;
    return time;
  }
}

function isBrowser() {
  return !isNode();
}

function isNode() {
  return typeof exports === 'object' && typeof exports.nodeName !== 'string';
}

module.exports = {
  printObj,
  deepCopy,
  timeNowSeconds,
};
