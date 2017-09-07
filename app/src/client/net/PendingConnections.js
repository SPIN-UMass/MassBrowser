/**
 * Created by milad on 4/15/17.
 */
class PendingConnections {
  constructor () {
    this.connections = {}
  }

  addPendingConnection (session) {
    this.connections[session.id] = session
  }

  getPendingConnection (token,relay) {
    console.log('connection before:', this.connections)
    if (token in this.connections) {
      const ses = this.connections[token]
      delete (this.connections[token])

      ses.relay_connected(relay)
    }

    return false
  }

}
var pendman = new PendingConnections()

module.exports = {'pendMgr': pendman}
