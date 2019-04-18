export class ConnectionAuthenticator {
  constructor () {
    this.connections = {}
  }

  addPendingConnection (token, description) {
    this.connections[token] = description
  }

  authenticate (token) {
    if (token in this.connections) {
      const desc = this.connections[token]
      delete (this.connections[token])
      return desc
    }
    return false
  }

}

export default ConnectionAuthenticator