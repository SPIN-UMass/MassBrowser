
// /**
//  * Created by milad on 6/28/17.
//  */

// // import models from '@/models' // required for bootstrapping remote models


import ZMQListener from '@/services/ZMQ'
console.log("Control")
try {
	ZMQListener.connect()
} catch(e) {
	console.log(e)
}



