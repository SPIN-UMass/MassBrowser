import config from '@utils/config'

import { ServiceRegistry } from './main'
import { getService } from './renderer'

export { getService } from './renderer'

export const serviceRegistry = config.isElectronMainProcess ? new ServiceRegistry() : null

export function createController(name, ctrlClass) {
  if (config.isElectronMainProcess) {
    let ctrl = typeof ctrlClass === 'object' ? ctrlClass : new ctrlClass()
    serviceRegistry.registerService(`ctrl:${name}`, ctrl)
    return ctrl
  } else if (config.isElectronRendererProcess) {
    return getService(`ctrl:${name}`)
  }
}