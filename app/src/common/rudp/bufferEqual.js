module.exports = function bufferEqual (a, b) {
  return Buffer.compare(a, b) === 0
}
