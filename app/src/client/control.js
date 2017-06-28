/**
 * Created by milad on 6/28/17.
 */

import Status from '~/utils/status'
import { startClientSocks } from './net/ClientSocks'
import ZMQListener from './services/ZMQ'

ZMQListener.connect()

process.on('uncaughtException', function (err) {
  console.log('err uncaught Exception  : ', err)
})
