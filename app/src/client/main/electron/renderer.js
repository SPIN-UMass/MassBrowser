import routes from './routes'
import { Raven, RavenVue } from '@utils/raven'
import config from '@utils/config'
import { store } from '@utils/store'
import { initializeLogging, warn } from '@utils/log'
import { initializeRendererProcess } from '@common/main/electron/renderer'

import Vue from 'vue'

if (config.sentry.enabled) {
  Raven.smartConfig()
  .addPlugin(RavenVue, Vue)
  .install()
} else {
  warn('Sentry is disabled, not using sentry')
}

initializeRendererProcess(routes, store.state.language)
