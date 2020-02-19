import { debug, warn } from '~/utils/log'
import { relayManager } from './services'

// import { connectToClientTCP } from '@/net/relays/TCPRelay'

const handlers = {
  'new-relay-session': data => relayManager.handleNewRelaySessions(data)
  // 'new-client-session': data => sessionService.handleNewClientSessions(data)
  // 'new-session': data => relayManager.onNewSessionEvent(data),
  // 'reconnected': reconnected,
  // 'client-session': connectClientSession
}

export function eventHandler (event, data) {
  let handler = handlers[event]
  if (handler) {
    handler(data)
  } else {
    warn(`Received event for unregistered event type '${event}'`)
  }
}

// function reconnected (data) {
//   debug('WS reconnected, refreshing info')
//   relayManager.handleReconnect()
// }
