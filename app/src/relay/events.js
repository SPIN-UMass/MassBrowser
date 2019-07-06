import { debug, warn } from '~/utils/log'
import { relayManager } from '@/services'
import { connectToClientTCP } from '@/net/relays/TCPRelay'
// import { connectToClientUDP } from '@/net/relays/UDPRelay'

const handlers = {
  'new-session': data => relayManager.onNewSessionEvent(data),
  'reconnected': reconnected,
  'client-session': connectClientSession
}

export function eventHandler (event, data) {
  let handler = handlers[event]
  if (handler) {
    handler(data)
  } else {
    warn(`Recieved event for unregistered event type '${event}'`)
  }
}

function reconnected (data) {
  debug('WS reconnected, refresshing info')
  relayManager.handleReconnect()
}

function connectClientSession (data) {
  let desc = {
    'writekey': (Buffer.from(data.read_key, 'base64')),
    'writeiv': (Buffer.from(data.read_iv, 'base64')),
    'readkey': (Buffer.from(data.write_key, 'base64')),
    'readiv': (Buffer.from(data.write_iv, 'base64')),
    'token': (Buffer.from(data.token, 'base64')),
    'client': data.client,
    'connectiontype': data.connection_type,
    'sessionId': data.id
  }

  // pendMgr.addPendingConnection((desc.token), desc)
  // add if to use UPD or TCP
  connectToClientTCP(data.client.ip, data.client.port, data.id)
}
