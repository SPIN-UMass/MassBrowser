'use strict'

import { app, BrowserWindow } from 'electron'
import { initAutoUpdater } from './auto_updater'
import config from '@utils/config'

export function initializeMainProcess() {
  let mainWindow

  const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:${process.env.DEV_PORT}`
    : `file://${__dirname}/index.html`


  function createWindow () {
    /**
     * Initial window options
     */
    mainWindow = new BrowserWindow({
      height: 500,
      width: 660,
      resizable: false
    })

    if (config.isProduction) {
      initAutoUpdater(mainWindow)  
    }
    
    mainWindow.loadURL(winURL)

    mainWindow.webContents.openDevTools()

    mainWindow.on('closed', () => {
      mainWindow = null
    })

    // eslint-disable-next-line no-console
    console.log('mainWindow opened')
  }

  app.on('ready', createWindow)

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })
}

