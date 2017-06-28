/**
 * Created by milad on 6/28/17.
 */

import Status from '~/utils/status'
import { startClientSocks } from './net/ClientSocks'

let status = Status.info('Starting ZEROMQ CLIENT')
startClientSocks('127.0.0.1', config.socksPort).then(() => { status.clear() })


process.on('uncaughtException', function (err) {
  console.log('err uncaught Exception  : ', err)
})
