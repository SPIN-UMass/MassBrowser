/**
 * Created by milad on 4/11/17.
 */
import {startClientSocks} from './ClientSocks';
import ConnectionManager from './ConnectionManager';
import RelayConnection from './RelayConnection'
import { RandomRelayAssigner } from './RelayAssigner'
import SessionManager from './SessionManager'
const crypto = require('crypto');
import api from '~/api/httpAPI'
import KVStore from '~/utils/kvstore'
var schedule = require('node-schedule')


export function startClient() {
  startClientSocks();
  /*const clientid= Buffer.alloc(32);

  const desc={'writekey':'12345678123456781234567812345678','writeiv':'a2xhcgAAAAAAAAAA','readkey':'12345678123456791234567812345679','readiv':'a2xhcgAAAAAAAAAB','clientid':String(clientid)};
  */
  KVStore.set('clientid','u-eCdwrScd0')
  api.authenticate('u-eCdwrScd0','BTg0qIVR82xjEXBf6V3ff1pAP32i0_qXojRaS0asUyz-xdwjTj70vFmPjt3eSYO-UpV7ifcHH_EjLKvaGhWxOx1v4tn8yf9oWLi2whiyb9cYQ3bTLP_hcsRuh8jPsT2qWx-M0pT3PCsImubv2RwGkP1VmQuhJF2QEPH6_a4HSSA=').then(()=>{

  schedule.scheduleJob('*/1 * * * * *',() => {api.getSessions().then((ses=>SessionManager.retrivedSessions(ses)  ))})

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
