import { createController } from '@utils/remote'
import config from '@utils/config'
import context from '@/context'

async function getRoute() {
  if (context.hasBooted) {
    return '/relay'
  } else {
    return '/boot'
  }  
}

export default createController('splash', {
  getRoute
})