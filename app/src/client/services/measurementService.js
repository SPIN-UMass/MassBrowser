
import { connectionManager, Session } from '@/net'
import { EventEmitter } from 'events'
import { warn, debug } from '@utils/log'
import { relayManager } from '../services'
import { SessionRejectedError, NoRelayAvailableError } from '@utils/errors'
import { store } from '@utils/store'
import { torService, telegramService } from '@common/services'
import { ConnectionTypes } from '@common/constants'
import udpConnectionService from '@common/services/UDPConnectionService'
import { Domain, Category } from '@/models'
import API from '@/api'
import {sessionService} from '../services'
import {policyManager} from '../services'
import config from '../../utils/config'
import {MeasurementTask} from '../net/testConnection'
const net = require('net')
class MeasurementService extends EventEmitter {
  constructor () {
    super()
    this.passiveInterval =  null
    
    store.ready.then(() => {
        
        this.enabled = store.state.measurementStatus
        debug("STORE RESULTS")
        if(this.enabled){
            debug("store says enabled")
        }
      })
  }


  async start () {
      let enabled = await this.isEnabled()
    if (enabled ) //have a option for turning off this feature 
    {   
        this._startPassiveMeasurment()
    }
    
  }

  _startPassiveMeasurment () {
    if (this.passiveInterval != null) {
      return
    }
    this._doPassiveMeasurement()
    this.passiveInterval = setInterval(() => {
      this._doPassiveMeasurement()
    }, 5 * 60  * 1000)
  }

  _isMBbusy(){
      return false
  }

  async _doPassiveMeasurement() {
      
      if (this._isMBbusy()){
          return
      }
      
      let enabled = await this.isEnabled()
      if (!enabled){
          return
      }
      let task = await API.getMeasurementTask()
      console.log('Measurement TARGET',task)
      let measurement = new MeasurementTask(task)
      let report = await measurement.runMeasurement()
      debug('MEASUREMENT REPORT',report)
      API.submitMeasurementReport(report)

  }
  
  async enable() {
    this.enabled = true
    await store.commit('setMeasurement', true)
    await this.start()
  }
  
  async disable() {
    this.enabled = false
    await store.commit('setMeasurement', false)
    if (this.passiveInterval){
        clearInterval(this.passiveInterval)
        this.passiveInterval=null
    }
  }

  async isEnabled() {
      
      await store.ready
      return this.enabled
    
  }


}
export const measurementService = new MeasurementService()
export default measurementService
