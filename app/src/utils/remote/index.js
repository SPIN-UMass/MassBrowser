import config from '@utils/config'


import * as main from './main'
import * as renderer from './renderer'
export let remote = {}
export let getService =  {} 
if (config.applicationInterface === 'electron') {
  if (config.isElectronRendererProcess) { 
      remote = renderer.remote 
      console.log("IAM IN HERE RENDERER")
      getService = renderer.getService
  }
  else{
      remote = main.remote
      console.log("IAM IN HERE ELEC")
  }
}



export function remoteModel(name, modelFactory){
  if (config.applicationInterface === 'electron') {
    if (config.isElectronRendererProcess) {
      return  renderer.getService(`model:${name}`)
    }
    else {
      
      const model = modelFactory()
      main.remote.registerService(`model:${name}`, model)
      return model
    }
    
  }
  else{
    return modelFactory()
  }
}

export function createController(name, ctrlClass){
  if (config.applicationInterface === 'electron') {
    if (config.isElectronRendererProcess) {
        return  renderer.getService(`ctrl:${name}`)
      //return getServiceRenderer(`ctrl:${name}`)
    }
    else {
    
      
      let ctrl = typeof ctrlClass === 'object' ? ctrlClass : new ctrlClass()
      main.remote.registerService(`ctrl:${name}`, ctrl)
      return ctrl
    }
  }
  else{
    return {}
  }
} 



// if (config.applicationInterface === 'electron') {
//   if (config.isElectronRendererProcess) {
//     console.log("SDFJASFAJG1234")
//     remote = remoteRenderer
//     getService = getServiceRenderer

//   }
//   else {
//     console.log("SDFJASFAJG")
//     remote = remoteMain
//   }
// }
// else{
//   remote = {}
// }


// if (config.applicationInterface === 'electron') {
//   if (config.isElectronRendererProcess) {
    
    
//     module.exports = {
//       getService,
//       remote,
//       createController: function(name, ctrlClass) {
//         return getService(`ctrl:${name}`)
//       },
//       remoteModel: function(name) {
//         return getService(`model:${name}`)
//       }
//     }
//   } else {
//     const { remote } = require('./main')

//     module.exports = {
//       remote,
//       createController: function(name, ctrlClass) {
//         let ctrl = typeof ctrlClass === 'object' ? ctrlClass : new ctrlClass()
//         remote.registerService(`ctrl:${name}`, ctrl)
//         return ctrl
//       },
//       remoteModel: function(name, modelFactory) {
//         const model = modelFactory()
//         remote.registerService(`model:${name}`, model)
//         return model
//       }
//     }
//   }
// } else {
//     module.exports = {
//       remoteModel: (name, modelFactory) => modelFactory()
//     }
// }
