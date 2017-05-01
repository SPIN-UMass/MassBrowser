import { runTLSserver } from './TLSReceiver'
import { runOBFSserver } from './OBFSReceiver'
import { pendMgr } from './PendingConnections'
import ServerConnection from '../../api/wsAPI'
import httpServerConnection from '../../api/httpAPI'
const clientid = Buffer.alloc(32)
const desc = {
  'readkey': '12345678123456781234567812345678',
  'readiv': 'a2xhcgAAAAAAAAAA',
  'writekey': '12345678123456791234567812345679',
  'writeiv': 'a2xhcgAAAAAAAAAB',
  'clientid': String(clientid)
}

httpServerConnection.authenticate('jj6YPRlkjnA', 'testtesttest').then(() => {
  console.log('ses',httpServerConnection.getSessionid())
  ServerConnection.connect(httpServerConnection.getSessionid())
    ServerConnection.on('connected', () => {
      //ServerConnection.authenticate('qfIQORjZZvQ','zxasqw12')

      console.log('WS CONNECTED')
      ServerConnection.relayUp().then((data) => {
        console.log('data',data)
        runOBFSserver('0.0.0.0', 8087)

        }
      )


    })
  }
)
