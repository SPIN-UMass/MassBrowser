import { runTLSserver } from './net/TLSReceiver'
import { runOBFSserver } from './net/OBFSReceiver'
import { pendMgr } from './net/PendingConnections'
import ServerConnection from '~/api/wsAPI'
import httpServerConnection from '~/api/httpAPI'
import KVstore from '~/utils/kvstore'


KVstore.set('relayid','rJLZ3f86r48')
httpServerConnection.authenticate('rJLZ3f86r48', 'qgx0JUahuBBRv2UFn9cX7v01onLOjrNeqpBe76fk5846-VvdkyWjGlPH5aFXHmCRssuqiDYiOFtSTfYmvvb5YsbHXymVBcJf_sXsc_VbN22D1r866f2ef1NFAUcKfEQBp38cP2Fe6bvCt6-hqWnSbdgbGbkDO2g-JT9TX5Q3KrE=').then(() => {

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
