

export class RelayAssigner {
  constructor() {

  }
  
  /**
   * Assign a relay to a (ip, port)
   * Should return with a promise
   * 
   * @return A RelayConnection instance
   */
  assignRelay(ip, port) {
    return null;
  }


}

export class RandomRelayAssigner extends RelayAssigner {
  constructor() {
    super()
    this.relayConnections = []
  }
  
  assignRelay(ip, port) {
    return new Promise((resolve, reject) => resolve(this.relayConnections[Math.floor(Math.random() * this.relayConnections.length)]));
  }

  addRelay(relay) {
    this.relayConnections.push(relay)
  }
}