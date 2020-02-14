import { debug, warn } from '~/utils/log'
import { sessionService } from './services/sessionService'

// import { connectToClientTCP } from '@/net/relays/TCPRelay'

const handlers = {
  'new-relay-session': data => { console.log('######', data) }
  // 'new-relay-session': data => handleNewRelaySessions(data),
  // 'new-client-session': data => sessionService.handleRetrievedSessions(data)
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

// function connectClientSession (data) {
//   let desc = {
//     'writekey': (Buffer.from(data.read_key, 'base64')),
//     'writeiv': (Buffer.from(data.read_iv, 'base64')),
//     'readkey': (Buffer.from(data.write_key, 'base64')),
//     'readiv': (Buffer.from(data.write_iv, 'base64')),
//     'token': (Buffer.from(data.token, 'base64')),
//     'client': data.client,
//     'connectiontype': data.connection_type,
//     'sessionId': data.id
//   }
//
//   // pendMgr.addPendingConnection((desc.token), desc)
//   // TODO condition for calling the correct function should be added here to use UPD or TCP
//   connectToClientTCP(data.client.ip, data.client.port, data.id)
// }

// function handleNewClientSessions () {
//   debug(`Session [${sessionInfo.id}] accepted by relay`)
//   try {
//     if (session.connectionType === ConnectionTypes.TCP_CLIENT) {
//       debug(`Connecting session [${sessionInfo.id}]`)
//       await session.connect()
//     } else if (session.connectionType === ConnectionTypes.TCP_RELAY) {
//       API.updateSessionStatus(sessionInfo.id, 'client_accepted')
//       await session.listen()
//     } else if (session.connectionType === ConnectionTypes.UDP) {
//       await session.connect()
//     }
//
//     this.sessions.push(session)
//     storeUpdateSession(sessionInfo, 'active')
//     this.emitSessionUpdate(session)
//
//     debug(`Session [${sessionInfo.id}] connected`)
//     resolve(session)
//     return session
//   } catch (err) {
//     debug(`Session [${sessionInfo.id}] connection to relay failed`)
//     reject(err)
//     // Report session failure to server
//     API.updateSessionStatus(sessionInfo.id, 'failed')
//     throw err
//   }
// }

function handleNewRelaySessions () {

}
