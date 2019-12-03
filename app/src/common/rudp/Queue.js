function Node(id, value) {
	this.id = id;
	this.value = value;
	this.next = null;
}

module.exports = Queue;
function Queue() {
	this._ids = {};
	this.size = 0;
	this._iterator = null;
	this._head = null;
	this._tail = null;
}

Queue.prototype.getIterator = function () {
	this._iterator = this._head;
	return this._iterator;
}

Queue.prototype.enqueue = function (id, object) {
	if (!!this._ids[id]){
		return
	}
	let newTail = new Node(id, object);
	this._ids[id] = newTail;
	this.size = this.size + 1;
	if (this._head === null) {
		this._head = newTail
		
	} else if (this._tail === null) {
		this._tail = newTail
		this._head.next = this._tail
	} else {
		this._tail.next = newTail;
		this._tail = newTail;
	}
}

Queue.prototype.pushFront = function (queue) {
	if (queue.size === 0) {
		return;
	}
	if (queue._tail === null) {
		queue._head.next = this._head;
		this._head = queue._head;
		return;
	}
	queue._tail.next = this._head
	this._head = queue._head
	this.size = this.size + queue.size;
}

Queue.prototype.dequeue = function () {
	if (this._head === null) {
		return null;
	}
	this.size = this.size - 1;
	let node = new Node(this._head.id, this._head.value);
	delete this._ids[node.id]
	this._head = this._head.next;
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