import { createController } from '@utils/remote'
import config from '@utils/config'
import context from '@/context'

async function getRoute() {
  if (context.hasBooted) {
    if (config.isProduction && !!await context.hasCompletedBrowserIntegration()){
      return '/browser-integration'
    } else {
      return '/client'
    }
  } else {
    if (context.hasRegistered()) {
      return '/boot'
    } else if (context.hasInvitationCode()){
      return '/register'
    } else {
      return '/start'
    }
  }  
}

export default createController('splash', {
  getRoute
})