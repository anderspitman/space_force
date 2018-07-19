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
  timeNowSeconds = function() {
    return 0;
  }
}

function isBrowser() {
  return true;
}

module.exports = {
  printObj,
  deepCopy,
  timeNowSeconds,
};
