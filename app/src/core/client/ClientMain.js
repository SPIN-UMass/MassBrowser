/**
 * Created by milad on 4/11/17.
 */
import {startClientSocks} from './ClientSocks';
import {Conmgr} from './ConnectionManager';
import {RelayConnection} from './RelayConnection'
const crypto = require('crypto');
export function startClient() {
  startClientSocks();
  const clientid= Buffer.alloc(4);
  const desc={'writekey':'12345678123456781234567812345678','writeiv':'a2xhcgAAAAAAAAAA','readkey':'12345678123456791234567812345679','readiv':'a2xhcgAAAAAAAAAB','clientid':String(clientid)};
  Conmgr.newRelayConnection('nonpiaz.cs.umass.edu',8087,'',desc);
  //Conmgr.connectionClose();


}
