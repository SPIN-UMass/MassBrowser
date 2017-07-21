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
    console.log(this.connections)
    if (token in this.connections) {
      const desc = this.connections[token]
      delete (this.connections[token])
      return desc
    }
    console.log(this.connections)
    return false
  }

}
var pendman = new PendingConnections()

module.exports = {'pendMgr': pendman}
