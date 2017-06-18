var async = require('async')
var Throttle = require('./throttle').Throttle
var ThrottleGroup = require('./throttle').ThrottleGroup

var tg = new ThrottleGroup({rate: 100})
var t1 = tg.throttle()
t1.on('data', (data) => { console.log(String(data)) })
t1.write('daarivarivda;kfjsaldgjdaslk;gjsadlk;fjasd;fj')
process.stdin.pipe(t1)
