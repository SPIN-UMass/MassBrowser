/**
 * Created by milad on 4/15/17.
 */
class PendingConnections {
  constructor(){
    this.connections={};
  }
  addPendingConnection(clientid, description) {
    this.connections[clientid]=description;
  }
  getPendingConnection(clientid) {
    if (clientid in this.connections){
      const desc= this.connections[clientid];
      delete (this.connections[clientid]);
      return desc;
    }
    return false;
  }
}
var pendman=new PendingConnections();

module.exports = {'pendMgr':pendman};
