/**
 * Created by milad on 5/2/17.
 */
import ConnectionManager from './ConnectionManager';

import RelayConnection from './RelayConnection';


class _SessionManager {

  constructor () {
    this.relays=[]
    this.mysessions={}
  }
  newRelayConnection(relayip, relayport, desc) {
    var relay = new RelayConnection(relayip, relayport, desc)

    relay.on('data', data => ConnectionManager.listener(data))
    relay.on('close', () => ConnectionManager.connection_close())

    relay.connect()
      .then(() => this.relays.push(relay) )
  }
  retrivedSessions(ses) {
    ses.forEach( (session) => {
      var desc = {
        'readkey': Buffer.from(session.read_key,'base64'),
        'readiv': Buffer.from(session.read_iv,'base64'),
        'writekey': Buffer.from(session.write_key,'base64'),
        'writeiv': Buffer.from(session.write_iv,'base64'),
        'token': (Buffer.from(session.token,'base64')),
      }
      if ( !( desc.token in this.mysessions)) {
        this.mysessions[desc.token]=desc
        console.log('relay ip is',session.relay.ip, session.relay.port)
        this.newRelayConnection(session.relay.ip, session.relay.port,desc)

      }

    })

  }
}



var SessionManager = new _SessionManager();
// module.exports = {ConnectionManager: _ConMgr};
export default SessionManager