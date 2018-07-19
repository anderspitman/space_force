function printObj(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

module.exports = {
  printObj,
  deepCopy,
};
