import { initializeMainProcess } from '@common/main/electron/main'
import { remote } from '@utils/remote'
import { debug } from '@utils/log'

import { statusManager } from '@common/services/statusManager'
import { autoUpdater, autoLauncher, dockHider, feedbackService, privacyPolicyService } from '@common/services'
import { syncService, registrationService, websiteSupportService } from '@/services'
import KVStore from '@utils/kvstore'
import { store } from '@utils/store' // required for boot, don't remove
import bootClient from '@/boot'
import {isFirefoxVersion,openInternalBrowser} from '@/firefox'
import models from '@/models' // required for bootstrapping remote models

remote.registerService('sync', syncService)
remote.registerService('status', statusManager)
remote.registerService('registration', registrationService)
remote.registerService('boot', { boot: bootClient })
remote.registerService('autoupdate', autoUpdater)
remote.registerService('autoLaunch', autoLauncher)
remote.registerService('dockHider', dockHider)
remote.registerService('kvstore', KVStore)
remote.registerService('feedback', feedbackService)
remote.registerService('website-support', websiteSupportService)
remote.registerService('privacy-policy', privacyPolicyService)

// let requireControllerFilter = require.context('@/controllers', true, /\.js$/)
// requireControllerFilter.keys().forEach(requireControllerFilter)


let currentWindow = null

function onWindowCreated(window) {
  debug("Window created")
  remote.setWebContents(window.webContents)
  currentWindow = window
  dockHider.windowOpened()
}

function onWindowClosed() {
  currentWindow = null
  remote.setWebContents(null)
  dockHider.windowClosed()
}

process.on('uncaughtException', (err) => {
  console.error(err)
})
isFirefoxVersion().then((isBundle)=>{
if (isBundle){
  initializeMainProcess(onWindowCreated, onWindowClosed,{
    label: 'Open Browser',
    click() {
      openInternalBrowser('http://massbrowser.cs.umass.edu/')
    }
  })

}
else {
  initializeMainProcess(onWindowCreated, onWindowClosed)
}
}).catch((err)=>{
  debug(err)
  initializeMainProcess(onWindowCreated, onWindowClosed)

})

