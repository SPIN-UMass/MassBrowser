/**
 * Created by milad on 4/24/17.
 */
/**
 * Created by milad on 4/12/17.
 */
import KVStore from '~/utils/kvstore'
const http = require('http')
var request = require('request')
var util = require('util')

class _Manager {
  constructor () {
    this.serverAddress = '127.0.0.1'
    this.serverPort = 8000

  }

  register () {

    return Promise( (resolve,reject) => {
      var requestData = {
      'ip': ip
      }

      request(util.format('ws://%s:%s/api/client/register', this.IPaddr, this.port),
        {json: true, body: requestData},
        function (err, res, body) {
          console.log(res,body)
          if (err)
          {
            reject(err)
          }
          else{
            resolve()
          }


          // `body` is a js object if request was successful
        })}
        )

  }
  requestSession() {
    if (!KVStore.get('clientFingerprint'))
    {
      this.register()


    }
    else {

    }
  }
  getSessions() {

  }

}
var Manager = new _Manager()
export default Manager