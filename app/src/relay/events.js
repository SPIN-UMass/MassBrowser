import { debug, warn } from '~/utils/log'
import { relayManager } from '@/services'
import { connectToClient } from '@/net/relays/TCPRelay'

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
  var desc = {
    'writekey': (Buffer.from(data.read_key, 'base64')),
    'writeiv': (Buffer.from(data.read_iv, 'base64')),
    'readkey': (Buffer.from(data.write_key, 'base64')),
    'readiv': (Buffer.from(data.write_iv, 'base64')),
    'token': (Buffer.from(data.token, 'base64')),
    'client': data.client,
    'connectionType': data.connection_type,
    'sessionId': data.id
  }

  pendMgr.addPendingConnection((desc.token), desc)

  connectToClient(data.client.ip, data.client.port, data.id)
}