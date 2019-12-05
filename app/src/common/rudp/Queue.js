var Lock = require('./Lock');

function Node(id, value) {
  this.id = id;
  this.value = value;
  this.next = null;
}

module.exports = Queue;
function Queue() {
  this._ids = {};
  this.size = 0;
  this._head = null;
  this._tail = null;
  this._lock = new Lock();
}

Queue.prototype.getIterator = function () {
  return Object.assign({}, this._head);
}

Queue.prototype.enqueue = async function (id, object) {
  await this._lock.acquire();
  if (!!this._ids[id]) {
    return
  }
  let node = new Node(id, object);
  this._ids[id] = node;
  if (this._head === null) {
    this._head = node

    this._tail = node

  } else {
    this._tail.next = node;
    this._tail = node;
  }
  this.size = this.size + 1;
  this._lock.release();
}

Queue.prototype.dequeue = async function () {
  await this._lock.acquire();
  if (this._head === null) {
    return null;
  }
  this.size = this.size - 1;
  let node = new Node(this._head.id, this._head.value);
  delete this._ids[node.id]
  this._head = this._head.next;
  this._lock.release();
  return node;
}

Queue.prototype.clear = function () {
  this._head = null;
  this._tail = null;
  this.size = 0;
};

Queue.prototype.currentNode = function () {
  if (this._head === null) {
    return null;
  }
  return this._head;
}

Queue.prototype.currentValue = function () {
  if (this._head === null) {
    return null;
  }
  return this._head.value;
};

Queue.prototype.toArray = function () {
  let list = [];
  let iter = this.getIterator();
  while(iter) {
    list.push(iter.value)
    iter = iter.next;
  }
  return list;
}
