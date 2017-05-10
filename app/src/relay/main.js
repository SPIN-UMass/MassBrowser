import { runTLSserver } from './net/TLSReceiver'
import { runOBFSserver } from './net/OBFSReceiver'
import { pendMgr } from './net/PendingConnections'
import ServerConnection from '~/api/wsAPI'
import httpServerConnection from '~/api/httpAPI'
import KVstore from '~/utils/kvstore'


KVstore.set('relayid','r-K6Qso9OUg')
httpServerConnection.authenticate('r-K6Qso9OUg', 'uvoFMxGG3QmlqahM6rPpOCVdyvwSkgdTR3cLRkp90vUU8-QlElmkF3SdIznrdHFgt-jN83Oy4_Lm9bksBi3Iz4fiEFXPdwGBuywmMM29NdKbUc0I6WYPKPDX9Upi0MHVhE41aKiLSbUj0JH9Ccc2BCuXOzluMpUarVJUGCncglE=').then(() => {

  console.log('ses',httpServerConnection.getSessionid())
  ServerConnection.connect(httpServerConnection.getSessionid())
    ServerConnection.on('connected', () => {
      //ServerConnection.authenticate('qfIQORjZZvQ','zxasqw12')

      console.log('WS CONNECTED')
      ServerConnection.relayUp('mac', '8087', 'FullCone').then((data) => {
          console.log('I AM HERE')
          console.log('data', data)
          runOBFSserver('0.0.0.0', 8087)

        }
      )
    })

    }

)
