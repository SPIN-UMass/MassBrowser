'use strict'

import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import Promise from 'bluebird'

import { initAutoUpdater } from './auto_updater'
import config from '@utils/config'

global.Promise = Promise

let mainWindow
let tray
let windowCreatedCallback
let windowClosedCallback

export function initializeMainProcess(onWindowCreated, onWindowClosed) {
  windowCreatedCallback = onWindowCreated
  windowClosedCallback = onWindowClosed

  app.on('ready', () => {
    initializeTray()
    createWindow()
  })

  app.on('window-all-closed', () => {
    // if (process.platform !== 'darwin') {
    //   app.quit()
    // }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })  
}

function initializeTray() {
  var image = nativeImage.createFromDataURL(require('@assets/images/tray.png'))
  tray = new Tray(image)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open MassBrowser',
      click() {
        if (mainWindow === null) {
          createWindow()
        } else {
          mainWindow.focus()
        }
      }
    },
    {
      label: 'Exit',
      click() {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
}

function createWindow () {
  const winURL = config.isDevelopment
  ? `http://localhost:${process.env.DEV_PORT}`
  : `file://${__dirname}/index.html`

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
    if (windowClosedCallback) {
      windowClosedCallback()
    }
  })

  if (windowCreatedCallback) {
    windowCreatedCallback(mainWindow)
  }

  // eslint-disable-next-line no-console
  return mainWindow
}

