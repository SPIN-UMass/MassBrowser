import { createController } from '@utils/remote'
import config from '@utils/config'
import context from '@/context'

async function getRoute() {
  if (context.hasBooted) {
    if (!(await context.hasCompletedBrowserIntegration())) {
      return '/browser-integration'
    } else {
      return '/client'
    }
  } else {
    if (await context.hasRegistered()) {
      return '/boot'
    } else {
      return '/start'
    }
  }  
}

export default createController('splash', {
  getRoute
})