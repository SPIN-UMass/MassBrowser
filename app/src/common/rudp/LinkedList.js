function Node(value) {
	this.value = value;
	this.next = null;
}

module.exports = LinkedList;
function LinkedList(orderBy) {
	this._head = null;
	this._orderBy = orderBy;
}

LinkedList.InsertionResult = {
	INSERTED: 0,
	EXISTS:  -1
};

LinkedList.prototype.insert = function (object) {
	let newNode = new Node(object);
	if (!this._head) {
		this._head = newNode;
		return LinkedList.InsertionResult.INSERTED;
	} else {
		let order = this._orderBy(newNode.value, this._head.value)
		if (order === 0) {
			return LinkedList.InsertionResult.EXISTS;
		} else if (order <= -1) {
			let temp = this._head;
			this._head = newNode;
			this._head.next = temp;
			return LinkedList.InsertionResult.INSERTED;
		} else if (order >= 1) {
			let currentNode = this._head;
			while (currentNode.next !== null && this._orderBy(newNode.value, currentNode.next.value) > 0 ) {
				currentNode = currentNode.next;
			}
			if (currentNode.next !== null && this._orderBy(newNode.value, currentNode.next.value) === 0) {
				return LinkedList.InsertionResult.EXISTS;
			}
			newNode.next = currentNode.next;
			currentNode.next = newNode;
			return LinkedList.InsertionResult.INSERTED;
		}
	}
};

LinkedList.prototype.clear = function () {
	this._head = null;
};

LinkedList.prototype.currentNode = function () {
	return this._head;
}

LinkedList.prototype.currentValue = function () {
	if (this._head === null) {
		return null;
	} else {
		return this._head.value;
	}
};

LinkedList.prototype.shift = function () {
	if (!this._head) {
		return false;
	}
	this._head = this._head.next;
	return true;
}

LinkedList.prototype.toArray = function () {
	let currentNode = this._head;
	let result = []
	while (currentNode !== null) {
		result.push(currentNode.value);
		currentNode = currentNode.next;
	}
	return result;
};