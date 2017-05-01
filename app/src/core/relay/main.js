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

httpServerConnection.authenticate('mEJOxpfXi3Q', 'IY5fCk20D25Upd-VaXHiNdv1b51T23g_J4VBgnPAHybF0LVRsytBS6-WxVqbmwOvyPLbqKXynxGFRFbVKggKQNU2Ey_bjufckuTNNKzpB2U1da8HS0y9rUF6pKnbq6GzKjjRTt84MA3_kbPnCqwgf_GoX75dxK5NDP9NG_AGfSY=').then(() => {
  console.log('ses',httpServerConnection.getSessionid())
  ServerConnection.connect(httpServerConnection.getSessionid())
    ServerConnection.on('connected', () => {
      //ServerConnection.authenticate('qfIQORjZZvQ','zxasqw12')

      console.log('WS CONNECTED')
      ServerConnection.relayUp('127.0.0.1','8087','FullCone').then((data) => {
        console.log('I AM HERE')
        console.log('data',data)
        runOBFSserver('0.0.0.0', 8087)

        }
      )


    })
  }
)
