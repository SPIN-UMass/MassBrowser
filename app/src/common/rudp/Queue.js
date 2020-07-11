var Lock = require('./Lock');
import {Semaphore} from 'await-semaphore'

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
  this._lock = new Semaphore(1);
}

Queue.prototype.getIterator =  async function () {
  let release = await this._lock.acquire()
  var res = Object.assign({}, this._head);
  release()
  return res
}

Queue.prototype.enqueue = async function (id, object) {
    let release = await this._lock.acquire()
    if (!!this._ids[id]) {
      throw new Error("WTF")
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
    release()
}

Queue.prototype.dequeue =  async function () {
  var selected_node = null
  let release = await this._lock.acquire()
  if (this._head === null) {
    return null;
  }
  this.size = this.size - 1;
  let node = new Node(this._head.id, this._head.value);
  this._ids[node.id] = null;
  delete this._ids[node.id]
  this._head = this._head.next;
  selected_node = node
  release()
  return selected_node
}

Queue.prototype.clear = async function () {
  let release = await this._lock.acquire()

  this._head = null;
  this._tail = null;
  this.size = 0;
  release()
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
