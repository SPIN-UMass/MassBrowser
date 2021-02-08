import packageJSON from 'package.json'
import path from 'path'

const defaultConfig = {
  client: {
    socksPort: 7080,
    socksSecondPort: 7081,
    torPort: 9055,
    cachebrowser: {
      mitmPort: 6425
    },
    web: {
      port: 6423,
      domain: null
    },
    noHostHandlerPort: 6422
  },
  relay: {
    tor: {
      listURL: '',
      listUpdateInterval: 432000000
    },
    natEnabled: true,
    port: 8040   /* Only used if natEnabled is false */,
    UDPPort: 8040,
    keepAliveInterval: 30,
    stunServer: {
      host: 'stun2.l.google.com',
      port: 19302
    }
  },
  sentry: {
    enabled: true,
    version: '',
    dsn: ''
  },
  log: {
    level: 'info'
  },
  relayConnectionTimeout: 5000
}

function initializeConfig(options) {
  let role = (options || {}).role
  let mode = (options || {}).mode
  let isDebug = (options || {}).debug
  let isFirefox = (options || {}).firefox
  

  const config = {}

  let opsys = process.platform
  if (opsys == "darwin") {
      opsys = "osx"
  } else if (opsys == "win32" || opsys == "win64") {
      opsys = "windows"
  } else if (opsys == "linux") {
      opsys = "linux"
  }
  if (role !== 'client' && role !== 'relay') {
    throw new Error("Invalid configuration role")
  }
  config.OS = opsys;

  function updateConfig (baseConfig, newConfig) {
      Object.keys(newConfig).forEach(key => {
        if (key in baseConfig && (typeof (baseConfig[key]) === 'object' && typeof (newConfig[key]) === 'object')) {
          return updateConfig(baseConfig[key], newConfig[key])
        } else if (newConfig[key] !== undefined) {
          baseConfig[key] = newConfig[key]
        }
      })
  }

  function configureWith(pConfig) {
    
    let devConfig = pConfig.dev || {}
    let prodConfig = pConfig.prod || {}
    pConfig.dev = undefined
    pConfig.prod = undefined

    let roleConfig = pConfig[role] || {}
    let roleDevConfig = pConfig[role].dev || {}
    let roleProdConfig = pConfig[role].prod || {}
    roleConfig.prod = undefined
    roleConfig.dev = undefined

    pConfig['client'] = undefined
    pConfig['relay'] = undefined

    updateConfig(config, pConfig)
    updateConfig(config, roleConfig)

    if (mode === 'development') {
      updateConfig(config, devConfig)
      updateConfig(config, roleDevConfig)
    } else {
      updateConfig(config, prodConfig)
      updateConfig(config, roleProdConfig)
    }
  }

  configureWith(defaultConfig)
  configureWith(packageJSON.config)

  updateConfig(config, options)

  if (config.mode === 'development') {
    console.log("Running in development mode")
    config.isDevelopment = true
    config.isProduction = false
    config.iconPath = path.join(process.cwd(),'app/assets/')
    config.extPath = path.join(process.cwd(),'app/assets/ext/')
    if (config.OS == "osx"){
      config.torPath =  path.join(process.cwd(),'app/assets/tor/tor-MB-osx-x86_64/Contents/MacOS/Tor/tor')
      
    }

    if (config.OS == "windows"){
      config.torPath =  path.join(process.cwd(),'app/assets/tor/tor-MB-windows-x86_64/Tor/tor.exe')
      
    }
    if (config.OS == "linux"){
      config.torPath =  path.join(process.cwd(),'app/assets/tor/tor-MB-linux-x86_64/Tor/tor')
    }
  } else {
    config.environment == 'production'
    config.isDevelopment = false
    config.isProduction = true

    if (config.OS == "osx"){
      config.torPath =  path.join(__dirname,'../../../../Tor/MacOS/Tor/tor')
      config.extPath = path.join(__dirname,'../../../../Resources/')
      config.iconPath = path.join(__dirname,'../../../../Resources/')

    }
    if (config.OS == "windows"){
      config.torPath =  path.join(process.cwd(),'Tor/tor.exe')
      config.extPath = process.cwd() //path.join(process.cwd(),'')
      config.iconPath = process.cwd()
    }
    if (config.OS == "linux"){
      config.torPath =  path.join(process.cwd(),'Tor/tor')
      config.extPath = process.cwd() //path.join(process.cwd(),'')
      config.iconPath = process.cwd()
    }

  }

  config.isClient = role === 'client'
  config.isRelay = role === 'relay'
  config.role = role

  config.isElectronRendererProcess = config.applicationInterface === 'electron' && config.electronProcess === 'renderer'
  config.isElectronMainProcess = config.applicationInterface === 'electron' && config.electronProcess === 'main'
  config.isElectronProcess = config.applicationInterface === 'electron'

  config.version = packageJSON.version


  config.isFirefoxVersion = config.isClient && isFirefox ==='YES'

  // config.appName = packageJSON.name // Now included directly in config

  config.isDebug = isDebug

  config.get = (name) => {
    const parts = name.split('.');
    let base = config;
    for (let part of parts) {
      base = base[part];
    }
    return base;
  }

  return config
}

const config = initializeConfig({
  mode: process.env.NODE_ENV,
  role: process.env.ROLE,
  applicationInterface: process.env.APP_INTERFACE,
  electronProcess: process.env.ELECTRON_PROCESS,
  debug: process.env.DEBUG,
  firefox : process.env.IS_FIREFOX
})

export default config