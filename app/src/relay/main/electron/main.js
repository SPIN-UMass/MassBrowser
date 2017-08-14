import { initializeMainProcess } from '@common/main/electron/main'
import { ServiceRegistry } from '@utils/remote'
import { debug } from '@utils/log'
import SyncService from '@/services/SyncService'
import StatusService from '@common/services/StatusService'
import Context from '@/context'
import bootRelay from '@/boot'
import HealthManager from '@/net/HealthManager'
import StatusReporter from '@/net/StatusReporter'


const serviceRegistry = new ServiceRegistry()
serviceRegistry.registerService('sync', SyncService)
serviceRegistry.registerService('status', StatusService)
serviceRegistry.registerService('context', Context)
serviceRegistry.registerService('health', HealthManager)
serviceRegistry.registerService('statusReporter', StatusReporter)

function onWindowCreated(window) {
  debug("Window created")
  serviceRegistry.setWebContents(window.webContents)
}

initializeMainProcess(onWindowCreated)

bootRelay()
.then(() =>  Context.bootFinished())