const exec = require('child_process').exec

import fs from 'fs-extra'
import path from 'path'
import { store } from '@utils/store'
import { getDataDir } from '@utils'
import config from '@utils/config'

function run (command) {
  return new Promise((resolve, reject) => {
    let child = exec(command)
    child.on('exit', code => {
      if (!code) {
        resolve()
      } else {
        reject()
      }
    })
  })
}

export async function isFirefoxVersion () {
  return config.isFirefoxVersion
}

export async function setClientVersion () {
  if (!store.state.browserIntegrationComplete) {
    let isFirefoxIncluded = await isFirefoxVersion()
    console.log(' I AM HEREHREHRE ',isFirefoxIncluded)
    if (isFirefoxIncluded) {
      await store.commit('updateInternalBrowserStatus')
    }
  }
}

export async function addCertificateToFirefox () {
  let certPath = path.join(getDataDir(), 'certs/ca.pem')
  let dbPath = path.join(process.cwd(), 'browser/profile')
  let certutil = path.join(process.cwd(), 'browser/nss-nspr/certutil')

  if (process.platform === 'win32') {
    let installCommand = `${certutil} -A -n "MassBrowser" -t "TCu,," -i ${certPath} -d "sql:${dbPath}"`
    await run(installCommand)
  }
  await store.commit('completeBrowserIntegration')
}

export async function openInternalBrowser (website) {
  let firefoxPath = path.join(process.cwd(), 'browser', 'firefox')
  let profilePath = path.join(process.cwd(), 'browser', 'profile')
  await run(`${firefoxPath} -profile "${profilePath}" ${website}`)
}

