/**
 * Created by milad on 4/15/17.
 */
class PendingConnections {
  constructor () {
    this.connections = {}
  }

  addPendingConnection (token, description) {
    this.connections[token] = description
  }

  getPendingConnection (token) {
    if (token in this.connections) {
      const desc = this.connections[token]
      delete (this.connections[token])
      return desc
    }
    return false
  }

}
var pendman = new PendingConnections()

module.exports = {'pendMgr': pendman}
