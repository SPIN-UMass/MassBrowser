class PendingConnections {
  constructor () {
    this.connections = {}
  }
  
  // connections the client waits for as they should be initiated by the relay
  addPendingConnection (session) {
    this.connections[session.id] = session
  }
  
  // called by RelayConnection.js when the connection is received
  setPendingConnection (token,relay) {
    console.log('connection before:', this.connections)
    if (token in this.connections) {
      console.log('session founded')
      const ses = this.connections[token]
      delete (this.connections[token])

      ses.relay_connected(relay)
    }

    return false
  }

}
var pendman = new PendingConnections()

module.exports = {'pendMgr': pendman}
