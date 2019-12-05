module.exports.splitArrayLike = function (arr, length) {
  length = length || 1;
  var retval = [];
  for (var i = 0; i < arr.length; i += length) {
    retval.push(arr.slice(i, i + length));
  }
  return retval;
};

module.exports.shuffle = function (o) {
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};

module.exports.getKeyByValue = function (object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

module.exports.generateRandomNumber = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
