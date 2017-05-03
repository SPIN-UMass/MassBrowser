import { runTLSserver } from './TLSReceiver'
import { runOBFSserver } from './OBFSReceiver'
import { pendMgr } from './PendingConnections'
import ServerConnection from '../../api/wsAPI'
import httpServerConnection from '../../api/httpAPI'
import KVstore from '../../utils/kvstore'


KVstore.set('relayid','uJCkEOZ4MWM')
httpServerConnection.authenticate('uJCkEOZ4MWM', 'diBByIVqPOFRBU9Ue_EoBXqu7cQk18f-pevZyDVw1rSKzSrS1HDWMXgP-Dcb9wHfalaeGuh7YH8Ovhzt71LC6F8UzeNwP8Efff6GSeDnxleYCIyU0VACJUWUGiWH0SQTec3I7YK2cl6zkmRmvKWweRFcx8crJqWhWjmc5ryFFEw=').then(() => {

  console.log('ses',httpServerConnection.getSessionid())
  ServerConnection.connect(httpServerConnection.getSessionid())
    ServerConnection.on('connected', () => {
      //ServerConnection.authenticate('qfIQORjZZvQ','zxasqw12')

      console.log('WS CONNECTED')
      ServerConnection.relayUp('127.0.0.1', '8087', 'FullCone').then((data) => {
          console.log('I AM HERE')
          console.log('data', data)
          runOBFSserver('0.0.0.0', 8087)

        }
      )
    })

    }

)
