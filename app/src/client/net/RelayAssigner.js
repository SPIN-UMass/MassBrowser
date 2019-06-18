export class RelayAssigner {
  /**
   * Assign a relay to a (ip, port)
   * Should return with a promise
   *
   * @return A TCPRelayConnection instance
   */
  assignRelay (ip, port) {
    return null
  }
}

export class RandomRelayAssigner extends RelayAssigner {
  constructor () {
    super()
  }

  assignRelay (ip, port) {
    // return new Promise((resolve, reject) => resolve(SessionManger.relays[Math.floor(Math.random() * SessionManger.relays.length)]));
  }

  addRelay (relay) {

  }
}
