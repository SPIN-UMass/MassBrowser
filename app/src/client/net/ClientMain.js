/**
 * Created by milad on 4/11/17.
 */
import { startClientSocks } from './ClientSocks'
import ConnectionManager from './ConnectionManager'
import RelayConnection from './RelayConnection'
import { RandomRelayAssigner } from './RelayAssigner'
import SessionManager from './SessionManager'
const crypto = require('crypto')
import api from '~/api/httpAPI'
import KVStore from '~/utils/kvstore'
var schedule = require('node-schedule')

export function startClient () {
  startClientSocks()
  /*const clientid= Buffer.alloc(32);

   const desc={'writekey':'12345678123456781234567812345678','writeiv':'a2xhcgAAAAAAAAAA','readkey':'12345678123456791234567812345679','readiv':'a2xhcgAAAAAAAAAB','clientid':String(clientid)};
   */
  KVStore.set('clientid', 'ioyrJaalhF0')
  api.authenticate('ioyrJaalhF0', 'Ffgdg4TiOLcEDTlbxeJ6dFh4sNeGzbpVoF6sWPwgnoqlQfhnSxfhEz7B0s1AMbrx6kLJ2Ncz6suHvhvkA4ppLZhtpKZ9KDVy7izUviTfBp0AB4rAVY385mdAfUCMYHjdkK7MkIFSw17SUSTNn0Mip0co0iQE-qB4xUPplA2Ec2s=').then(() => {

    schedule.scheduleJob('*/1 * * * * *', () => {api.getSessions().then((ses => SessionManager.retrivedSessions(ses)  ))})

    api.requestSession()
    api.clientUp()

    var relayAssigner = new RandomRelayAssigner()
    ConnectionManager.setRelayAssigner(relayAssigner)
  })
  /*ConnectionManager.newRelayConnection('127.0.0.1', 8087, desc)
   .then(relay => relayAssigner.addRelay(relay))
   .catch(err =>  console.log(err))
   */
  //Conmgr.connectionClose();
}
