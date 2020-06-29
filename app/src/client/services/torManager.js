
import {spawn} from 'child_process'
import config from '@utils/config'
import { debug, error } from '@utils/log'
import fs from 'fs-extra'
import { getDataDir } from '@utils'
import path from 'path'

class TorManager  {
  constructor () {
    this.isRunning = false
    this.process = {}
    this.torConfigPath = path.join(getDataDir(),"tor")

    this.generateConfig()

  }
  generateConfig() {
    fs.ensureDir(this.torConfigPath).then(()=>{
      fs.writeFile(path.join(this.torConfigPath, 'torrc'),`
      DataDirectory ${path.join(this.torConfigPath,'data')}
      Socks5Proxy 127.0.0.1:${config.socksPort}
      UseEntryGuards 0
      SOCKSPort 9055
      `)
    })

  }
  async start (){
    if (this.isRunning)
    {
      return
    }
    this.process = spawn(config.torPath, ['-f', path.join(this.torConfigPath, 'torrc')])
    this.isRunning = true
    this.process.on("error",(err)=>{
      error(err)
      this.restart()
    })
    this.process.on("exit",(code,signal )=>{
      // debug(`TOR stopped with code ${code} signal ${signal}`)
      this.restart()
    })


  }
  async stop (){
    if (!this.isRunning)
    {
      return
    }
    this.process.kill(9)
    this.isRunning = false

  }
  async restart (){
    await this.stop()
    await this.start()
  }


}

export const torManager = new TorManager()
export default torManager
