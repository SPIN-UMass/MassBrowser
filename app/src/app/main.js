import Vue from 'vue'
import Electron from 'vue-electron'
import Resource from 'vue-resource'
import Router from 'vue-router'
import VueMask from 'v-mask'
import Promise from 'bluebird'

import App from './App'
import routes from './routes'

import { Raven, RavenVue } from '~/utils/raven'
import Status from '~/utils/status'
import config from '~/utils/config'
import {initializeLogging, warn} from '~/utils/log'

import 'assets/font-awesome/css/font-awesome.min.css'
import 'assets/bootstrap/css/bootstrap.min.css'
import 'assets/nifty/nifty.min.css'

// Overwrite native Promise implementation with Bluebird's
window.Promise = Promise;

Vue.use(Electron)
Vue.use(Resource)
Vue.use(Router)
Vue.use(VueMask)

Vue.config.debug = true

config.applicationInterface = 'electron'
initializeLogging()

if (config.sentry.enabled) {
  Raven.smartConfig()
  .addPlugin(RavenVue, Vue)
  .install()
} else {
  warn('Sentry is disabled, not using sentry')
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
