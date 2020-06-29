var EventEmitter = require('events').EventEmitter;
var util = require('util');

module.exports = Lock;
function Lock () {
  this._locked = false;
  this._ee = new EventEmitter();
};

Lock.prototype.release = function () {
  // Release the lock immediately
  this._locked = false;
  setImmediate(() => this._ee.emit('release'));
}

Lock.prototype.acquire = function () {
  return new Promise(resolve => {
    // If nobody has the lock, take it and resolve immediately
    if (!this._locked) {
      // Safe because JS doesn't interrupt you on synchronous operations,
      // so no need for compare-and-swap or anything like that.
      this._locked = true;
      return resolve();
    }

    // Otherwise, wait until somebody releases the lock and try again
    const tryAcquire = () => {
      if (!this._locked) {
        this._locked = true;
        this._ee.removeListener('release', tryAcquire);
        return resolve();
      }
    };
    this._ee.on('release', tryAcquire);
  });
}
