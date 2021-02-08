
// /**
//  * Created by milad on 6/28/17.
//  */

// // import models from '@/models' // required for bootstrapping remote models


import ZMQListener from '@/services/ZMQ'

async function run () {
	ZMQListener.connect()
}

run()
