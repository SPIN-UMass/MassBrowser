/**
 * Created by milad on 4/11/17.
 */
import { startClientSocks } from './ClientSocks';
import ConnectionManager from './ConnectionManager';
import RelayConnection from './RelayConnection'
import { RandomRelayAssigner } from './RelayAssigner'
const crypto = require('crypto');

export function startClient() {
  startClientSocks();
  const clientid= Buffer.alloc(32);
  const desc={'writekey':'12345678123456781234567812345678','writeiv':'a2xhcgAAAAAAAAAA','readkey':'12345678123456791234567812345679','readiv':'a2xhcgAAAAAAAAAB','clientid':String(clientid)};

  var relayAssigner = new RandomRelayAssigner()
  ConnectionManager.setRelayAssigner(relayAssigner)
  
  ConnectionManager.newRelayConnection('127.0.0.1', 8087, desc)
    .then(relay => relayAssigner.addRelay(relay))
    .catch(err =>  console.log(err))

  //Conmgr.connectionClose();
}
