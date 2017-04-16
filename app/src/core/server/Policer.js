/**
 * Created by milad on 4/13/17.
 */

export class PolicyManager {
  constructor() {
    this.server = 'TBD';

  }

  checkDestination(ip, port) {
    return true;
  }

}
var Police = new PolicyManager();
module.exports = {policy: Police};
