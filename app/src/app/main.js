import Vue from 'vue'
import Electron from 'vue-electron'
import Resource from 'vue-resource'
import Router from 'vue-router'

import App from './App'
import routes from './routes'

import { Raven, RavenVue } from '~/utils/raven'
import Status from '~/utils/status'
import Config from '~/utils/config'
import Log from '~/utils/log'

import 'assets/font-awesome/css/font-awesome.min.css'
import 'assets/bootstrap/css/bootstrap.min.css'
import 'assets/nifty/nifty.min.css'

Vue.use(Electron)
Vue.use(Resource)
Vue.use(Router)

Vue.config.debug = true

if (Config.sentry.enabled) {
  Raven.smartConfig()
  .addPlugin(RavenVue, Vue)
  .install()
} else {
  Log.warn('Sentry is disabled, not using sentry')
}

const router = new Router({
  scrollBehavior: () => ({ y: 0 }),
  routes
})

// Status.on('status-changed', function (status) {
//   console.log(status.text)
// })

/* eslint-disable no-new */
var options = Object.assign({router}, App)
new Vue(options).$mount('#app')
