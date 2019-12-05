var Queue = require('./Queue');

var q = new Queue();

q.enqueue(9, 9);
// console.log(q.toArray())
q.enqueue(8, 8);
// console.log(q.toArray())
q.enqueue(5, 5);
console.log(q.toArray())
console.log(q.dequeue());
console.log(q.toArray())
