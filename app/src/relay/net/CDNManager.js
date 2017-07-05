/**
 * Created by milad on 7/3/17.
 */
import CDNSocketMeek from './CDNSocketMeek'
class _CDNManger {
  constructor () {
    this.connectionmap = {}
  }

  handleIncommingConnection (req, res) {
    if (!(req.socket in this.connectionmap)) {
      this.connectionmap[req.socket] = new CDNSocketMeek(req.socket, req.headers.isPooling || false, req.headers.rtt || 40, req.headers.timeout || 500)
    }
    this.connectionmap[req.socket].newRequest(req, res)
  }
}
var CDNManager = new _CDNManger()
export default CDNManager
