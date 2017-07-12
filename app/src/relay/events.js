import { debug, warn } from '~/utils/log'

import { pendMgr } from '~/relay/net/PendingConnections'
import API from '~/relay/api'

const handlers = {
  'new-session': newSession
}

export function eventHandler(event, data) {
  let handler = handlers[event]
  if (handler) {
      handler(data)
  } else {
      warn(`Recieved event for unregistered event type '${event}'`)
  }
}

function newSession(data) {
  var desc = {
    'writekey': (Buffer.from(data.read_key,'base64')),
    'writeiv': (Buffer.from(data.read_iv,'base64')),
    'readkey': (Buffer.from(data.write_key,'base64')),
    'readiv': (Buffer.from(data.write_iv,'base64')),
    'token': (Buffer.from(data.token,'base64')),
    'client': data.client,
    'sessionId': data.id

  }
  debug('session',desc,desc.token.length,Buffer.from(data.token,'base64').length)

  pendMgr.addPendingConnection((desc.token),desc)
  API.acceptSession(data.client, data.id)
}