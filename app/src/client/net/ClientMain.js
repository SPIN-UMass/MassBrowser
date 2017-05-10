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
  KVStore.set('clientid','q9FotGmR__c')
  api.authenticate('q9FotGmR__c','98hwQVo_covc8Zp1gGnJZmT3beQ5MSQKJmddr2fReIe60hWKKLcRSKYZyoWSiiyawCsK_WqFM-UUMEebiJ9Axo4fPqcuf5NsHQdaDMC9BOi9xsrgho0bOJK2_DJcyWpxjdGotCA_KR-EbnsbGNIy8C_v3gjRXYJk7cyJZWGyoFs=').then(()=>{

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
