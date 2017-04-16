import {runTLSserver} from './TLSReceiver';


import {runOBFSserver} from './OBFSReceiver';
import {pendMgr} from './PendingConnections';
const clientid= Buffer.alloc(4);
const desc={'readkey':'12345678123456781234567812345678','readiv':'a2xhcgAAAAAAAAAA','writekey':'12345678123456791234567812345679','writeiv':'a2xhcgAAAAAAAAAB','clientid':String(clientid)};

pendMgr.addPendingConnection(String(clientid),desc);
runOBFSserver(8087);
