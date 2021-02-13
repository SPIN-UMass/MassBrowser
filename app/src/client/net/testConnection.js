import http from 'http'
import https from 'https'
import {URL} from 'url'
import {massbrowserCreateConnection,MassBrowserTestScoket} from './mbTestSocket'
import { info, warn, debug,error } from '@utils/log'
import net from 'net'
const shttp = require('socks5-http-client')
import config from '@utils/config'

const DIRECT = 0
const HTTP = 1
const HTTPS = 2
const CACHEBROWSE = 3
const TOR = 4

const TIMEOUT = 30 * 1000


export class MeasurementTask {
    constructor (task) {
        this.task = task
        
        this.targetUrl = new  URL(task.target.url)
        
        this.type = task.target.measurement_type
        this.startTime = null
        this.connectTime = null
        this.socket = null

    }
    createConnection (options) {
        return net.createConnection(options)
    }
    
    generateReport(status,err,content){
        let relay = null
        if (this.socket){
            if (this.socket instanceof MassBrowserTestScoket)
            {
                
                relay = this.socket._handle.relay.id
            }
        }
        

        return {
            'task': this.task.id,
            'return_code' : status,
            'error': (err)? err.message : null,
            'download_time':  Date.now() - this.startTime,
            'connect_time':  (this.connectTime)? this.connectTime - this.startTime: -1,
            'content_size': (content)? content.length : -1,
            'relay': relay
        }
    }

    async timedHTTPDownload() {
        
        return new Promise((resolve,reject) => {
            let req = http.get({
            hostname: this.targetUrl.hostname,
            port: this.targetUrl.port,
            timeout : TIMEOUT,
            createConnection : massbrowserCreateConnection
        }, (res) => {
            debug(res.headers)
            let rawData = '';
          res.on('data', (chunk) => { 
            rawData += chunk })
          res.on('end', () => {
            resolve(this.generateReport(res.statusCode,null,res.rawHeaders+rawData))
            
          })
          res.on('error',(error) => {
            resolve(this.generateReport(-1,error,null))
          })
          res.on('timeout',() => {
            resolve(this.generateReport(408,'TimeOut',null))
          })
          


          
          })

          
          req.on('error', (e) => {
            resolve(this.generateReport(-1,e,null))
          })
          req.on('socket',(socket)=>{
              this.socket = socket

              socket.on('connect',()=>{
                  this.connectTime = Date.now()

              })
          })
          
          })

    }
    async timedHTTPSDownload() {
        
        return new Promise((resolve,reject) => {
            let req = https.get({
            hostname: this.targetUrl.hostname,
            port: this.targetUrl.port,
            timeout : TIMEOUT,
            createConnection : massbrowserCreateConnection
        }, (res) => {
            debug(res.headers)
            let rawData = '';
          res.on('data', (chunk) => { 
            rawData += chunk })
          res.on('end', () => {
            resolve(this.generateReport(res.statusCode,null,res.rawHeaders+rawData))
            
          })
          res.on('error',(error) => {
            resolve(this.generateReport(-1,error,null))
          })
          res.on('timeout',() => {
            resolve(this.generateReport(408,'TimeOut',null))
          })


          
          })

          
          req.on('error', (e) => {
            resolve(this.generateReport(-1,e,null))
          })
          req.on('socket',(socket)=>{
              this.socket = socket

              socket.on('connect',()=>{
                  this.connectTime = Date.now()

              })
          })
          
          })

    }
    async timedDIRECTDownload() {
        
        return new Promise((resolve,reject) => {
            let req = https.get({
            hostname: this.targetUrl.hostname,
            port: this.targetUrl.port,
            timeout : TIMEOUT
        }, (res) => {
            debug(res.headers)
            let rawData = '';
          res.on('data', (chunk) => { 
            rawData += chunk })
          res.on('end', () => {
            resolve(this.generateReport(res.statusCode,null,res.rawHeaders+rawData))
            
          })
          
          res.on('error',(error) => {
            resolve(this.generateReport(-1,error,null))
          })
          res.on('timeout',() => {
            resolve(this.generateReport(408,'TimeOut',null))
          })

          
          })

          
          req.on('error', (e) => {
            resolve(this.generateReport(-1,e,null))
          })
          req.on('socket',(socket)=>{
              this.socket = socket

              socket.on('connect',()=>{
                  this.connectTime = Date.now()

              })
          })
          
          })

    }
    async timedTorDownload() {
        
        return new Promise((resolve,reject) => {
            let req = shttp.get({
            
            hostname: this.targetUrl.hostname,
            port: this.targetUrl.port,
            timeout : TIMEOUT,
            socksHost: 'localhost',
            socksPort: config.tor.port
        }, (res) => {
            debug(res.headers)
            let rawData = '';
          res.on('data', (chunk) => { 
            rawData += chunk })
          res.on('end', () => {
            resolve(this.generateReport(res.statusCode,null,res.rawHeaders+rawData))
            
          })
          res.on('error',(error) => {
            resolve(this.generateReport(-1,error,null))
          })
          res.on('timeout',() => {
            resolve(this.generateReport(408,'TimeOut',null))
          })


          
          })

          
          req.on('error', (e) => {
            resolve(this.generateReport(-1,e,null))
          })
          req.on('socket',(socket)=>{
              this.socket = socket

              socket.on('connect',()=>{
                  this.connectTime = Date.now()

              })
          })
          
          })

    }


    runMeasurement(){
        this.startTime = Date.now()
        if (this.type === HTTP){
            return this.timedHTTPDownload()
        }
        if (this.type === HTTPS){
            return this.timedHTTPSDownload()
        }
        if (this.type === DIRECT){
            return this.timedDIRECTDownload()
        }
        if (this.type === TOR){
            return this.timedTorDownload()
        }
        if (this.type === CACHEBROWSE){
            return this.generateReport(-1,'NOT IMPLEMENTED',null)
        }
    }

}
    